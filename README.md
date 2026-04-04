# Scrummage — Rugby Drill Hub

A web platform for rugby coaches to upload drills, browse a searchable drill library, and build printable practice plans.

**Stack:** React 18 · Django 4 · PostgreSQL · AWS S3

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [1. Environment variables](#1-environment-variables)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Feature Status](#feature-status)
- [Roadmap](#roadmap)

---

## Overview

Scrummage lets coaches:

- Upload drills with a video (stored in S3) and step-by-step instructions
- Browse and search the drill library by title, category, and skill level
- Assemble named practice plans from the drill library, with per-drill custom reps, timing, and coach notes
- Print a practice plan directly from the browser

The monetisation model is freemium: free access with ads, ad-free paid tier. The `is_subscribed` flag is already on the `User` model; the paywall and ad integration are planned for the polish phase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router v6, Axios |
| Backend | Django 4.2, Django REST Framework 3.15 |
| Auth | `djangorestframework-simplejwt` — 60 min access / 7 day refresh |
| Database | PostgreSQL (`psycopg2-binary`) |
| File storage | AWS S3 via `django-storages[s3]` + `boto3` (presigned PUT uploads) |
| CORS | `django-cors-headers` |
| Password hashing | bcrypt (BCryptSHA256PasswordHasher, first in the hashers list) |

---

## Project Structure

```
scrummage/
  backend/
    backend/          # Django project — settings, root URLs, WSGI
    api/              # Django app — models, serializers, views, URLs, migrations
    manage.py
  frontend/
    src/
      api/
        client.js     # Axios instance with JWT Bearer header + auto-refresh interceptor
      components/
        NavBar.jsx
      pages/
        LoginPage.jsx
        DrillLibraryPage.jsx
        DrillDetailPage.jsx
        DrillUploadPage.jsx
        PracticePlanPage.jsx
    vite.config.js    # Dev proxy: /api → http://localhost:8000
  requirements.txt
  .env.example        # Copy to .env and fill in values — never commit .env
```

---

## Prerequisites

- Python 3.11+
- Node 18+
- A running PostgreSQL instance
- An AWS S3 bucket (optional for local development without video upload)

---

## Local Setup

### 1. Environment variables

Copy the root `.env.example` to `.env` and fill in every value:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | Yes | Django secret key — generate one with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | No | `True` for local dev, `False` for production (default: `False`) |
| `ALLOWED_HOSTS` | No | Comma-separated hostnames (default: `localhost,127.0.0.1`) |
| `HTTPS_ENABLED` | No | Set `True` in production to enable SSL redirect and HSTS (default: `False`) |
| `DB_NAME` | Yes | PostgreSQL database name |
| `DB_USER` | Yes | PostgreSQL user |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | No | PostgreSQL host (default: `localhost`) |
| `DB_PORT` | No | PostgreSQL port (default: `5432`) |
| `AWS_ACCESS_KEY_ID` | Yes* | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes* | AWS secret key |
| `AWS_STORAGE_BUCKET_NAME` | Yes* | S3 bucket name |
| `AWS_S3_REGION_NAME` | No | S3 region (default: `us-east-1`) |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins, e.g. `http://localhost:5173` |

*AWS credentials are required only when testing presigned video uploads. Other endpoints work without them.

The settings file loads `.env` from the repository root (`load_dotenv` is called relative to `backend/backend/settings.py`).

The frontend also has its own environment file:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL for the Axios client |

Note: in development the Vite dev server proxies all `/api` requests to `http://localhost:8000`, so `VITE_API_URL` only matters for the token-refresh fallback path in `client.js`.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional, gives Django admin access
python manage.py runserver
```

The API is now available at `http://localhost:8000`.

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is available at `http://localhost:5173`. All `/api` calls are proxied to the Django dev server.

---

## API Reference

All endpoints are under `/api/`. Every endpoint except register and login requires a JWT `Authorization: Bearer <access_token>` header.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create a new user account |
| `POST` | `/api/auth/token/` | Obtain JWT access + refresh tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh the access token |
| `GET` | `/api/auth/me/` | Get the current authenticated user's profile |

**Register request body:**
```json
{ "username": "coach_jane", "email": "jane@example.com", "password": "min8chars" }
```

**Token request body:**
```json
{ "username": "coach_jane", "password": "min8chars" }
```

**Token response:**
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### Drills

All drill endpoints are scoped to the authenticated user. Staff users see all drills; regular users see only their own.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/drills/` | List the user's drills |
| `POST` | `/api/drills/` | Create a new drill |
| `GET` | `/api/drills/{id}/` | Get a single drill |
| `PUT` | `/api/drills/{id}/` | Full update (owner only) |
| `PATCH` | `/api/drills/{id}/` | Partial update (owner only) |
| `DELETE` | `/api/drills/{id}/` | Delete a drill (owner only) |

**Drill fields on write:** `title`, `description`, `category`, `skill_level` (`beginner` / `intermediate` / `advanced`), `instructions` (JSON array of strings), `video_url` (nullable S3 URL).

`created_by`, `created_at`, and `updated_at` are read-only and set automatically.

### Practice Plans

Scoped to the authenticated user. Staff users see all plans.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/practice-plans/` | List the user's practice plans |
| `POST` | `/api/practice-plans/` | Create a new practice plan |
| `GET` | `/api/practice-plans/{id}/` | Get a plan with all nested drills |
| `PUT` | `/api/practice-plans/{id}/` | Full update |
| `PATCH` | `/api/practice-plans/{id}/` | Partial update |
| `DELETE` | `/api/practice-plans/{id}/` | Delete a plan |
| `POST` | `/api/practice-plans/{id}/drills/` | Add a drill to the plan |
| `PATCH` | `/api/practice-plans/{id}/drills/{entry_id}/` | Update a drill entry's reps, duration, or notes |
| `DELETE` | `/api/practice-plans/{id}/drills/{entry_id}/` | Remove a drill from the plan |

**Plan fields on write:** `title`, `description` (optional), `practice_date` (ISO date, optional).

**Add-drill request body:**
```json
{ "drill_id": 42, "order": 0, "custom_reps": 5, "custom_duration": 60, "coach_notes": "Focus on footwork" }
```
`custom_reps`, `custom_duration` (seconds), and `coach_notes` are all optional.

The `{entry_id}` in the drill sub-actions is the `PracticePlanDrill` record ID, returned in the `plan_drills` array of the plan response.

### S3 Presigned Upload

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/s3/presigned-upload/` | Generate a 5-minute presigned S3 PUT URL |

**Request body:**
```json
{ "filename": "scrummage_drill.mp4", "content_type": "video/mp4" }
```

**Response:**
```json
{ "upload_url": "https://s3.amazonaws.com/...", "object_key": "uploads/<user_id>/scrummage_drill.mp4" }
```

Allowed content types: `video/mp4`, `image/jpeg`, `image/png`, `image/gif`.

The upload flow used by the frontend is:
1. `POST /api/s3/presigned-upload/` to get the presigned URL
2. `PUT <upload_url>` directly from the browser with the file body
3. Strip the query string from `upload_url` to get the permanent S3 URL, then include it as `video_url` in the drill creation request

---

## Data Models

### User (`api.User`)

Extends Django's `AbstractUser`.

| Field | Type | Notes |
|---|---|---|
| `id` | integer (BigAutoField) | PK |
| `username` | varchar | unique, inherited |
| `email` | varchar | inherited |
| `password` | varchar | bcrypt hash |
| `role` | varchar | `coach` / `player` / `admin`, default `coach` |
| `is_subscribed` | boolean | freemium flag, default `False` |
| `date_joined` | datetime | inherited |

`AUTH_USER_MODEL = "api.User"` — always use `get_user_model()` in application code.

### Drill

| Field | Type | Notes |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar(255) | |
| `description` | text | |
| `category` | varchar(100) | free text |
| `skill_level` | varchar(20) | `beginner` / `intermediate` / `advanced` |
| `instructions` | JSON | ordered list of step strings |
| `video_url` | URLField | nullable, points to S3 |
| `created_by` | FK → User | set automatically from request |
| `created_at` | datetime | auto |
| `updated_at` | datetime | auto |

Default ordering: `-created_at`.

### PracticePlan

| Field | Type | Notes |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar(255) | |
| `description` | text | optional |
| `coach` | FK → User | set automatically from request |
| `practice_date` | date | optional |
| `created_at` | datetime | auto |
| `updated_at` | datetime | auto |

Default ordering: `-created_at`.

### PracticePlanDrill (junction)

| Field | Type | Notes |
|---|---|---|
| `id` | integer | PK |
| `plan` | FK → PracticePlan | |
| `drill` | FK → Drill | |
| `order` | positive integer | default 0; unique together with `plan` |
| `custom_reps` | positive integer | nullable |
| `custom_duration` | positive integer | seconds, nullable |
| `coach_notes` | text | optional, blank default |

Default ordering: `order`.

---

## Feature Status

### Implemented (MVP)

- JWT authentication: register, login, token refresh, `/me/` profile endpoint
- Drill CRUD — create, read, update, delete via DRF `ModelViewSet`
- Drill upload form with optional S3 video upload via presigned PUT URL
- Drill library page with client-side search, category, and skill-level filters
- Drill detail page with video player, ordered instruction list, inline edit, and delete
- Practice plan CRUD — create, list, select, delete
- Practice plan builder — add drills from library, remove drills, update custom reps/duration/notes per drill entry
- Print button on the practice plan page (`window.print()`)
- `ProtectedRoute` wrapper — unauthenticated users are redirected to `/login`
- Axios client with automatic JWT header injection and silent token refresh on 401

### Planned

| Feature | Phase |
|---|---|
| Ad integration for free tier | Phase 4 |
| Subscription paywall (ad-free tier) | Phase 4 |
| Responsive design pass | Phase 4 |
| Social sharing (Instagram, Twitter/X) | Phase 5 |
| In-app messaging and coaching groups | Phase 5 |
| AI-assisted instruction generation | Phase 5 |
| Native iOS and Android apps | Phase 5 |

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| Phase 1 — Foundation | Django project, PostgreSQL, JWT auth, S3 config, React init | Done |
| Phase 2 — Drills Core | Drill model, S3 presigned upload, drill CRUD API, drill UI pages | Done |
| Phase 3 — Practice Plans | PracticePlan + junction model, plan builder UI, print view | Done |
| Phase 4 — Polish & Launch | Ad integration, subscription flag, responsive design, E2E tests, deployment | Planned |
| Phase 5 — Growth | Social sharing, in-app messaging, AI instructions, native mobile apps | Planned |
