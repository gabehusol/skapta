import os
from contextlib import contextmanager

from psycopg2.pool import SimpleConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("Missing DATABASE_URL environment variable. Check your .env file.")

# A small pooled set of connections, reused across requests.
_pool = SimpleConnectionPool(minconn=1, maxconn=10, dsn=DATABASE_URL)


@contextmanager
def get_connection():
    """Borrow a connection from the pool. Commits on success, rolls back on error."""
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def init_db() -> None:
    """Create tables if they don't exist. Runs on startup (v1 has no migrations)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    auth0_id TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE,
                    name TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
