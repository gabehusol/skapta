import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class GenerationOptions(BaseModel):
    monorepo: bool = True
    language: str = "typescript"
    orm: str = "prisma"
    linting: bool = True


class StackSelection(BaseModel):
    frontend: str = Field(..., max_length=100)
    backend: str = Field(..., max_length=100)
    database: str = Field(..., max_length=100)
    auth: str = Field(..., max_length=100)
    deployment: str = Field(..., max_length=100)
    additional: list[str] = Field(default=[], max_length=10)


class GenerateRequest(BaseModel):
    stack: StackSelection
    project_name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(default="", max_length=2000)
    options: GenerationOptions = GenerationOptions()

    @field_validator("project_name")
    @classmethod
    def validate_project_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9\-_]*$", v):
            raise ValueError(
                "project_name must start with a letter or number and contain "
                "only letters, numbers, hyphens, and underscores"
            )
        return v
