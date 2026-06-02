from pydantic import BaseModel
from typing import Optional


class GenerationOptions(BaseModel):
    monorepo: bool = True
    language: str = "typescript"
    orm: str = "prisma"
    linting: bool = True


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
    options: GenerationOptions = GenerationOptions()
