#runs the full RAG pipeline
import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from retrieval.query import search
from retrieval.reranker import rerank

load_dotenv()

GROQ_MODEL = "llama-3.3-70b-versatile"
TEMPERATURE = 0.2
MAX_TOKENS = 2000

#How much of each retrieved chunk to include in the prompt. Chunks are ~2000
#chars; balanced retrieval keeps the total context reasonable, so we can afford
#to pass a fuller excerpt than the old 500-char slice.
CHUNK_CHARS = 900

#all valid choices the LLM can rec
SUPPORTED_OPTIONS = {
    "frontend": ["React + Vite", "Next.js", "Vue + Vite"],
    "backend": ["Node.js + Express", "FastAPI", "Django"],
    "database": ["PostgreSQL", "MongoDB", "Supabase", "MySQL"],
    "auth": ["Auth0", "Supabase Auth", "NextAuth", "Firebase Auth"],
    "deployment": ["Vercel", "Railway", "AWS EC2 + Docker", "Render"],
    "additional": ["Docker + Docker Compose", "GitHub Actions CI/CD", "Socket.io", "Stripe", "Cloudinary / Supabase Storage"]
}

#JSON Schema itll follow — LLM only generates recommendations, not retrieved_sources
RESPONSE_SCHEMA = {
    "recommendations": {
        "frontend": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "backend": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "database": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "auth": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "deployment": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "additional": ["string"]
    }
}

SYSTEM_PROMPT = """You are Skapta, an expert software architect. Recommend a complete tech stack for the user's project.

Rules:
- Choose every field ONLY from these supported options:
{supported_options}
- Base each choice on the specific needs in the description (scale, real-time, SEO/SSR, payments, ML, file uploads, auth complexity, etc.).
- Ground your reasoning in the documentation excerpts below when relevant; prefer options whose docs fit the project's needs.
- Each "reason" must be one or two sentences tied to the project's actual requirements, not generic filler.
- "alternatives" must be one or two other supported options for that category, excluding the chosen one.
- "additional" should only include add-ons the project genuinely needs.

Strong defaults (apply judgment based on the description):
- If database is Supabase and auth requirements are simple, prefer Supabase Auth — it integrates natively and reduces complexity
- If database is Supabase but the project needs enterprise auth, social login at scale, or complex roles, Auth0 may be better
- If frontend is Next.js, prefer NextAuth unless Supabase Auth is the better fit
- If the app needs a persistent database, prefer Railway over Vercel for deployment
- If the app needs real-time features (chat, notifications, live updates), include Socket.io in additional

Documentation excerpts:
{retrieved_chunks}

Respond ONLY with valid JSON matching this exact schema — no text outside the JSON, no markdown fences:
{schema}"""


def build_context(chunks: list[dict]) -> str:
    lines = []
    for chunk in chunks:
        lines.append(f"[{chunk['technology']}] {chunk['text'][:CHUNK_CHARS]}")
    return "\n\n".join(lines)


def parse_llm_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        #strip opening
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        #strip closing
        raw = raw.split("```")[0]
    return json.loads(raw.strip())


CORE_CATEGORIES = ["frontend", "backend", "database", "auth", "deployment"]


def validate_recommendations(result: dict) -> dict:
    #Clamp the LLM output to supported options so a hallucinated or off-list
    #choice can never reach the project generator.
    recs = result.get("recommendations", {})

    for cat in CORE_CATEGORIES:
        supported = SUPPORTED_OPTIONS[cat]
        entry = recs.get(cat) or {}

        choice = entry.get("choice", "")
        if choice not in supported:
            #keep the model's reasoning but coerce to a supported default
            choice = supported[0]
        entry["choice"] = choice
        entry.setdefault("reason", "")

        #alternatives must be supported and exclude the chosen option
        alts = [a for a in entry.get("alternatives", []) if a in supported and a != choice]
        if not alts:
            alts = [o for o in supported if o != choice][:2]
        entry["alternatives"] = alts

        recs[cat] = entry

    #additional add-ons must be from the supported list
    add_supported = SUPPORTED_OPTIONS["additional"]
    recs["additional"] = [a for a in recs.get("additional", []) if a in add_supported]

    result["recommendations"] = recs
    return result


def recommend(description: str) -> dict:
    #get pinecone top 20
    results = search(description)

    #rerank top 5 per tech
    reranked = rerank(description, results)

    #prompt context from reranked chunks
    context = build_context(reranked)
    system_prompt = SYSTEM_PROMPT.format(
        supported_options=json.dumps(SUPPORTED_OPTIONS, indent=2),
        retrieved_chunks=context,
        schema=json.dumps(RESPONSE_SCHEMA, indent=2)
    )

    #call groq
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=GROQ_MODEL,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        #force valid JSON output instead of relying on markdown-fence stripping
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Project description: {description}\nRecommend the best stack for this project.")
    ]

    response = llm.invoke(messages)

    #Parse LLM response
    try:
        result = parse_llm_response(response.content)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw response: {response.content}")

    #Clamp choices to supported options before anything downstream uses them
    result = validate_recommendations(result)

    # Build retrieved_sources from actual reranked chunks (not LLM-generated)
    seen = set()
    retrieved_sources = []
    for chunk in reranked:
        key = (chunk["technology"], chunk["source_url"])
        if key not in seen:
            seen.add(key)
            retrieved_sources.append({
                "technology": chunk["technology"],
                "source_url": chunk["source_url"],
                "relevance_score": round(chunk["rerank_score"], 4),
            })
    result["retrieved_sources"] = retrieved_sources
    return result


if __name__ == "__main__":
    result = recommend("I'm building a social media app with user auth, image uploads, and real-time notifications")
    print(json.dumps(result, indent=2))
