from models.recommend import (
    RecommendResponse,
    RecommendationResult,
    RetrievedSource,
    StackChoice,
)

# Hardcoded recommendations for Phase 1 MVP.
# These will be replaced by the RAG pipeline in Phase 2.
_HARDCODED_RECOMMENDATIONS: dict[str, RecommendationResult] = {
    "default": RecommendationResult(
        frontend=StackChoice(
            choice="React + Vite",
            reason="React's component model and large ecosystem make it the default choice for most SPAs. Vite provides fast HMR and a modern build pipeline with minimal config.",
            alternatives=["Next.js", "Vue + Vite"],
        ),
        backend=StackChoice(
            choice="Node.js + Express",
            reason="Express is lightweight and pairs naturally with a React frontend for a JS full-stack setup. Its middleware model is straightforward and well-documented.",
            alternatives=["FastAPI", "Django"],
        ),
        database=StackChoice(
            choice="PostgreSQL",
            reason="PostgreSQL is the safe default for most apps — strong consistency, excellent JSON support, and battle-tested at scale.",
            alternatives=["MongoDB", "Supabase"],
        ),
        auth=StackChoice(
            choice="Auth0",
            reason="Auth0 provides social login, JWT management, and user management out of the box with minimal setup time.",
            alternatives=["Supabase Auth", "Firebase Auth"],
        ),
        deployment=StackChoice(
            choice="Railway",
            reason="Railway supports Node.js and PostgreSQL together in one platform, making initial deployment simple with no separate database provisioning.",
            alternatives=["Vercel", "Render"],
        ),
        additional=[],
    ),
    "realtime": RecommendationResult(
        frontend=StackChoice(
            choice="React + Vite",
            reason="React's component model handles real-time state updates well. Pairing with Socket.io client is straightforward.",
            alternatives=["Next.js", "Vue + Vite"],
        ),
        backend=StackChoice(
            choice="Node.js + Express",
            reason="Node's event loop is designed for high-concurrency I/O and integrates natively with Socket.io for real-time bidirectional communication.",
            alternatives=["FastAPI", "Django"],
        ),
        database=StackChoice(
            choice="PostgreSQL",
            reason="Your relational data (users, posts, relationships) maps well to PostgreSQL's table model with strong consistency.",
            alternatives=["MongoDB", "Supabase"],
        ),
        auth=StackChoice(
            choice="Auth0",
            reason="Auth0 handles social login and JWT issuance, letting you focus on app logic rather than auth infrastructure.",
            alternatives=["Supabase Auth", "Firebase Auth"],
        ),
        deployment=StackChoice(
            choice="Railway",
            reason="Railway co-locates your Node.js server and PostgreSQL instance with one-click provisioning.",
            alternatives=["Render", "AWS EC2 + Docker"],
        ),
        additional=["Socket.io", "Docker + Docker Compose"],
    ),
    "data": RecommendationResult(
        frontend=StackChoice(
            choice="React + Vite",
            reason="React pairs well with data visualization libraries (Recharts, Victory) and handles dynamic dashboards effectively.",
            alternatives=["Next.js", "Vue + Vite"],
        ),
        backend=StackChoice(
            choice="FastAPI (Python)",
            reason="FastAPI is the natural choice for data-heavy or ML-adjacent apps — it runs in the Python ecosystem where your data processing libraries live.",
            alternatives=["Node.js + Express", "Django"],
        ),
        database=StackChoice(
            choice="PostgreSQL",
            reason="PostgreSQL handles analytical queries well and integrates with Python's data stack (SQLAlchemy, pandas).",
            alternatives=["MongoDB", "MySQL"],
        ),
        auth=StackChoice(
            choice="Auth0",
            reason="Auth0's Python SDK integrates cleanly with FastAPI middleware.",
            alternatives=["Supabase Auth", "Firebase Auth"],
        ),
        deployment=StackChoice(
            choice="Railway",
            reason="Railway's managed PostgreSQL and Python runtime keep infrastructure simple for data apps.",
            alternatives=["Render", "AWS EC2 + Docker"],
        ),
        additional=["Docker + Docker Compose"],
    ),
    "nextjs": RecommendationResult(
        frontend=StackChoice(
            choice="Next.js",
            reason="Your project needs SSR or strong SEO. Next.js provides server-side rendering, static generation, and a file-based router with no extra config.",
            alternatives=["React + Vite", "Vue + Vite"],
        ),
        backend=StackChoice(
            choice="Node.js + Express",
            reason="Express pairs well with a Next.js frontend for API routes that need more control than Next.js API routes provide.",
            alternatives=["FastAPI", "Django"],
        ),
        database=StackChoice(
            choice="PostgreSQL",
            reason="PostgreSQL is the standard relational database for Next.js + Node stacks with robust ORM support (Prisma, Drizzle).",
            alternatives=["Supabase", "MongoDB"],
        ),
        auth=StackChoice(
            choice="NextAuth",
            reason="NextAuth is purpose-built for Next.js with built-in OAuth providers, session management, and zero-config JWT handling.",
            alternatives=["Auth0", "Supabase Auth"],
        ),
        deployment=StackChoice(
            choice="Vercel",
            reason="Vercel is the canonical deployment platform for Next.js — edge functions, preview deployments, and ISR all work out of the box.",
            alternatives=["Railway", "Render"],
        ),
        additional=[],
    ),
}

_HARDCODED_SOURCES: list[RetrievedSource] = [
    RetrievedSource(
        technology="React",
        source_url="https://react.dev/learn",
        relevance_score=0.0,
    ),
]


def _classify_description(description: str) -> str:
    """Pick a hardcoded recommendation bucket based on keywords in the description."""
    lower = description.lower()
    if any(kw in lower for kw in ("real-time", "realtime", "socket", "notification", "chat", "live")):
        return "realtime"
    if any(kw in lower for kw in ("machine learning", "ml", "data pipeline", "analytics", "dashboard", "python")):
        return "data"
    if any(kw in lower for kw in ("seo", "blog", "marketing", "server-side", "ssr", "next.js", "nextjs")):
        return "nextjs"
    return "default"


def get_recommendations(description: str) -> RecommendResponse:
    bucket = _classify_description(description)
    recommendations = _HARDCODED_RECOMMENDATIONS[bucket]
    return RecommendResponse(
        recommendations=recommendations,
        retrieved_sources=_HARDCODED_SOURCES,
    )
