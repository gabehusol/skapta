# Embeds a user query and searches Pinecone for the top-k most similar chunks
import os
from functools import lru_cache
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

load_dotenv()

MODEL_NAME = "all-mpnet-base-v2"

# Technologies in the corpus grouped by the stack category they belong to.
# Retrieval runs one filtered query per category so every category is grounded,
# even when the prompt is dominated by a single topic (e.g. "websockets").
CATEGORY_TECHNOLOGIES = {
    "frontend": ["React", "Next.js", "Vue"],
    "backend": ["Express", "FastAPI", "Django"],
    "database": ["PostgreSQL", "MongoDB", "Supabase"],
    "auth": ["Auth0", "NextAuth", "Firebase", "Supabase"],
    "deployment": ["Vercel", "Railway", "Docker"],
    "additional": ["Docker", "Socket.io", "Stripe"],
}


#load the embedding model once and reuse it (loading per request is slow and
#spikes RAM — see DEPLOY.md §1)
@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


#embed with same model
def embed_query(query: str) -> list[float]:
    embedding = _get_model().encode(query)
    return embedding.tolist()


#reuse a single Pinecone client/index handle instead of building one per request
@lru_cache(maxsize=1)
def _get_index():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    return pc.Index(os.getenv("PINECONE_INDEX_NAME"))


def _match_to_dict(match) -> dict:
    return {
        "text": match.metadata["text"],
        "technology": match.metadata["technology"],
        "source_url": match.metadata["source_url"],
        "score": match.score,
    }


#Balanced retrieval: run one filtered query per stack category so each category
#is grounded, then let the reranker pick the best chunks per technology.
def search(query: str, per_category: int = 8) -> list[dict]:
    vector = embed_query(query)
    index = _get_index()

    results = []
    seen_ids = set()
    for technologies in CATEGORY_TECHNOLOGIES.values():
        response = index.query(
            vector=vector,
            top_k=per_category,
            include_metadata=True,
            filter={"technology": {"$in": technologies}},
        )
        for match in response.matches:
            if match.id in seen_ids:
                continue
            seen_ids.add(match.id)
            results.append(_match_to_dict(match))

    return results
