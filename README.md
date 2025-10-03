# HaqooqAI

HaqooqAI is an end-to-end retrieval-augmented legal assistant that connects a modern frontend to an AI-powered backend. The system combines vector search, LLM calls, and application infrastructure to support conversational queries, source citation, and quota-controlled usage.

This README focuses on the project's purpose, capabilities, and how to run it locally.

## Capabilities

- Retrieval-Augmented Generation (RAG): document embedding, vector similarity search (ChromaDB), and contextual prompt composition.
- LLM integration: adapter for the Groq API with optional per-user API keys.
- Conversation management: persistent conversations and message storage in Supabase/Postgres.
- Authentication & authorization: GitHub OAuth flows and token validation for protected endpoints.
- Quota & API-key management: per-user quota enforcement and support for API-key bypass.
- Deployment-ready: Docker configuration and CI workflows for automated deployments.

## Architecture overview

- Frontend: Vite + React + TypeScript, protected routes, conversation UI, and settings for API keys and quotas (located at `frontend/HaqooqAI-frontend/`).
- Backend: FastAPI app orchestrating auth, RAG processing, quota checks, and storage (located at `backend/`).
- Database: Supabase (Postgres) for user, usage, and conversation persistence.
- Vector store: ChromaDB for document embeddings and retrieval.
- LLM provider: Groq, Gemini, and OpenAI (configurable via environment and optional per-user key).

## Quick local run

Backend (minimal):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# copy backend/.env.example -> backend/.env and fill required values
uvicorn src.main:app --reload
```

Frontend (minimal):

```bash
cd frontend/HaqooqAI-frontend
npm install
npm run dev
```

The frontend dev server runs on the port printed by Vite. Configure the frontend env to point to your backend API URL.

## Local dev convenience: bypass OAuth in frontend

When you need to view protected pages locally without completing the full OAuth redirect flow, create `frontend/HaqooqAI-frontend/.env.local` with:

```text
VITE_DISABLE_AUTH=true
```

When this flag is set the frontend can be configured to return a development user from the auth hook and allow protected routes. This is strictly a local development convenience and must not be enabled in production.

If desired, a small patch can be applied to `src/hooks/useAuth.ts` and `components/auth/AuthGuard.tsx` to implement this behavior.

## Branch organization and recommended workflow

- `backend` — backend development only (changes limited to `backend/`).
- `frontend` — frontend development only (changes limited to `frontend/HaqooqAI-frontend/`).
- `develop` — integration branch that contains both frontend and backend for combined testing and demo deployments.

Suggested safe merge approach into `develop` (avoids delete/modify conflicts): selectively check out folders from each branch into `develop` and commit, or resolve conflicts by accepting the branch-local folder contents.

## Developer notes and references

- Backend implementation and API details: see `Haqooqai Backend Documentation - Updated.md` and `backend/`.
- Frontend components and hooks: see `frontend/HaqooqAI-frontend/src/` (notably the auth hook and `AuthGuard`).
- Database migrations: `backend/database_schemas/`.
