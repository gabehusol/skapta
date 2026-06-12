from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.provider import require_auth
from db.connection import get_connection

router = APIRouter()


class UserUpsert(BaseModel):
    name: str | None = None
    email: str | None = None


def _serialize(row) -> dict:
    return {
        "id": row[0],
        "auth0Id": row[1],
        "email": row[2],
        "name": row[3],
        "createdAt": row[4].isoformat() if row[4] else None,
    }


@router.get("/users/me")
def get_me(claims: dict = Depends(require_auth)) -> dict:
    auth0_id = claims["sub"]
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, auth0_id, email, name, created_at FROM users WHERE auth0_id = %s",
                (auth0_id,),
            )
            row = cur.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize(row)


@router.post("/users/me")
def upsert_me(body: UserUpsert, claims: dict = Depends(require_auth)) -> dict:
    auth0_id = claims["sub"]
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (auth0_id, email, name)
                VALUES (%s, %s, %s)
                ON CONFLICT (auth0_id)
                DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
                RETURNING id, auth0_id, email, name, created_at
                """,
                (auth0_id, body.email, body.name),
            )
            row = cur.fetchone()

    return _serialize(row)
