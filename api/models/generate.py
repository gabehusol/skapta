from pydantic import BaseModel
from typing import Optional


class StackSelection(BaseModel):
    frontend: str
    backend: str
    database: str
    auth: str
    deployment: str
    additional: list[str] = []


class GenerateRequest(BaseModel):
    stack: StackSelection
    project_name: str
    description: Optional[str] = ""
