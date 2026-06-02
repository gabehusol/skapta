# Embeds a user query and searches Pinecone for the top-k most similar chunks
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

load_dotenv()

MODEL_NAME = "all-mpnet-base-v2"

#embed with same model
def embed_query(query: str) -> list[float]:
    model = SentenceTransformer(MODEL_NAME)
    embedding = model.encode(query)
    return embedding.tolist()

#embeds query and searches pinecone for top k most similar
def search(query: str, top_k: int = 20) -> list[dict]:
    vector = embed_query(query)

    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

    response = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True
    )

    results = []
    for match in response.matches:
        results.append({
            "text": match.metadata["text"],
            "technology": match.metadata["technology"],
            "source_url": match.metadata["source_url"],
            "score": match.score,
        })
    return results
