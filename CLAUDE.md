# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Scrummage** (Rugby Drill Hub) is a web app for coaches to manage rugby drills and practice plans.

## Tech Stack

- **Backend**: Django + Django REST Framework, Python 3
  - Auth: `djangorestframework-simplejwt` (JWT, 60 min access / 7 day refresh)
  - Storage: `django-storages[s3]` + `boto3` for S3 presigned uploads
  - DB: PostgreSQL via `psycopg2-binary`
  - CORS: `django-cors-headers`
  - Password hashing: bcrypt first
- **Frontend**: React 18 + Vite
  - Routing: `react-router-dom` v6
  - HTTP: `axios` with a JWT interceptor (`frontend/src/api/client.js`)

## Structure

```
scrummage/
  backend/
    backend/        # Django project (settings, urls, wsgi)
    api/            # Django app (models, serializers, views, urls)
    manage.py
  frontend/
    src/
      api/          # axios client
      components/   # NavBar, etc.
      pages/        # LoginPage, DrillLibraryPage, DrillDetailPage, PracticePlanPage
    index.html
    vite.config.js
  requirements.txt
  .env.example      # copy to .env and fill in values — never commit .env
  .gitignore
```

## Key conventions

- All secrets in `.env` (never committed). See `.env.example` for required vars.
- Security settings (HTTPS, HSTS) are toggled via `HTTPS_ENABLED` in `.env` so dev can run without TLS.
- `AUTH_USER_MODEL = "api.User"` — always use `get_user_model()` in app code.
- API base: `/api/` — drills at `/api/drills/`, plans at `/api/practice-plans/`, presigned upload at `/api/s3/presigned-upload/`.
- JWT endpoints: `/api/auth/token/` and `/api/auth/token/refresh/`.

## Commit conventions

- Write commit messages in the **imperative mood**, present tense: "Add drill serializer" not "Added" or "Adding".
- Keep the subject line under 72 characters.
- Group commits by logical concern — one commit per distinct change (e.g. don't mix backend model changes with frontend routing changes).
- Prefix with a short scope when useful: `backend:`, `frontend:`, `db:`, `config:`, `docs:`.
- Never commit `.env` or any file containing secrets.
- Always commit migration files alongside the model changes that generated them.
