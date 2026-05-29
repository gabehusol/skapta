#runs the full RAG pipeline
import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage

from retrieval.query import search
from retrieval.reranker import rerank

load_dotenv()

GROQ_MODEL = "llama-3.3-70b-versatile"
TEMPERATURE = 0.2
MAX_TOKENS = 2000

#all valid choices the LLM can rec
SUPPORTED_OPTIONS = {
    "frontend": ["React + Vite", "Next.js", "Vue + Vite"],
    "backend": ["Node.js + Express", "FastAPI", "Django"],
    "database": ["PostgreSQL", "MongoDB", "Supabase", "MySQL"],
    "auth": ["Auth0", "Supabase Auth", "NextAuth", "Firebase Auth"],
    "deployment": ["Vercel", "Railway", "AWS EC2 + Docker", "Render"],
    "additional": ["Docker + Docker Compose", "GitHub Actions CI/CD", "Socket.io", "Stripe", "Cloudinary / Supabase Storage"]
}

#JSON Schema itll follow
RESPONSE_SCHEMA = {
    "recommendations": {
        "frontend": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "backend": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "database": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "auth": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "deployment": {"choice": "string", "reason": "string", "alternatives": ["string"]},
        "additional": ["string"]
    },
    "retrieved_sources": [
        {"technology": "string", "source_url": "string", "relevance_score": 0.0}
    ]
}

SYSTEM_PROMPT = """You are Skapta, an expert software architect. You recommend tech stacks based on project descriptions.

Only recommend from these supported options:
{supported_options}

You have access to these documentation excerpts to ground your recommendations:
{retrieved_chunks}

Respond ONLY with valid JSON matching this exact schema — no text outside the JSON, no markdown fences:
{schema}"""


def build_context(chunks: list[dict]) -> str:
    lines = []
    for chunk in chunks:
        #truncate each chunk to 500 chars to keep the prompt from getting too long
        lines.append(f"[{chunk['technology']}] {chunk['text'][:500]}")
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
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Project description: {description}\nRecommend the best stack for this project.")
    ]

    response = llm.invoke(messages)

    #Parse then return the json
    try:
        return parse_llm_response(response.content)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw response: {response.content}")


if __name__ == "__main__":
    result = recommend("I'm building a social media app with user auth, image uploads, and real-time notifications")
    print(json.dumps(result, indent=2))
