# Uploads embedded chunks to Pinecone with metadata
import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

BATCH_SIZE = 100


def get_index():
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    return index

#convert chunks into upsert
def format_vectors(chunks: list[dict]) -> list[dict]:
    vectors = []
    for i, chunk in enumerate(chunks):
        vectors.append({
            "id": f"{chunk['technology']}-{chunk['chunk_index']}-{i}",
            "values": chunk["embedding"],
            "metadata": {
                "technology": chunk["technology"],
                "source_url": chunk["url"],
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
            }
        })
    return vectors

#formats and uploads all chunks to pinecone in batches, avoide hitting req limit
def upload(chunks: list[dict]) -> None:
    index = get_index()
    vectors = format_vectors(chunks)

    for i in range(0, len(vectors), BATCH_SIZE):
        batch = vectors[i : i + BATCH_SIZE]
        index.upsert(vectors=batch)
        print(f"Uploaded batch {i // BATCH_SIZE + 1} ({len(batch)} vectors)")
