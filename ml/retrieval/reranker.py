#reranks retrieved chunks using a cross-encoder, returning top_n per technology
from functools import lru_cache
from sentence_transformers import CrossEncoder

MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

#load and return cross encoder — cached so it loads once, not per request
#(loading per request is slow and spikes RAM — see DEPLOY.md §1)
@lru_cache(maxsize=1)
def load_reranker() -> CrossEncoder:
    """Load and return the cross-encoder model (cached for the process lifetime)."""
    return CrossEncoder(MODEL_NAME)

#use cross encoder for reranking pinecone results, group by tech
def rerank(query: str, results: list[dict], top_n: int = 5) -> list[dict]:
    reranker = load_reranker()

    pairs = [[query, r["text"]] for r in results]
    scores = reranker.predict(pairs)

    for i, result in enumerate(results):
        result["rerank_score"] = float(scores[i])

    #group results by technology
    grouped = {}
    for result in results:
        tech = result["technology"]
        if tech not in grouped:
            grouped[tech] = []
        grouped[tech].append(result)

    #sort by rerank_score descending
    final = []
    for tech, chunks in grouped.items():
        sorted_chunks = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)
        final.extend(sorted_chunks[:top_n])

    return final
