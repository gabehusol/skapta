import os
from contextlib import contextmanager

from psycopg2.pool import SimpleConnectionPool

# Pool is initialised lazily on first use so the server can start and fail
# with a clear error even when the database is temporarily unavailable.
_pool: SimpleConnectionPool | None = None


def _get_pool() -> SimpleConnectionPool:
    global _pool
    if _pool is None:
        url = os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError(
                "Missing DATABASE_URL environment variable. Check your .env file."
            )
        _pool = SimpleConnectionPool(minconn=1, maxconn=10, dsn=url)
    return _pool


@contextmanager
def get_connection():
    """Borrow a connection from the pool. Commits on success, rolls back on error."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


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
