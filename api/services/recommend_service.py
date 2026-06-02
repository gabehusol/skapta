import sys
import os

# Add ml/ to path so we can import the RAG pipeline from the api layer
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'ml'))

from models.recommend import RecommendResponse
from pipeline.rag import recommend as rag_recommend


def get_recommendations(description: str) -> RecommendResponse:
    result = rag_recommend(description)
    return RecommendResponse.model_validate(result)
