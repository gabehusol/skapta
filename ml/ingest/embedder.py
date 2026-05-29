from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-mpnet-base-v2"

#cached locally 
def load_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)

#generates 768d embeddings for the chunks
def embed_chunks(chunks: list[dict]) -> list[dict]:
    model = load_model()
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts)        
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i].tolist()
    return chunks
