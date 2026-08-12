# AI Interview Intelligence Platform — Production Architecture

This document describes the production environment and architecture requirements for the AI Interview Intelligence Platform.

## System Architecture

```text
┌─────────────────────────────────────────────┐
│                 CLIENT                      │
│                                             │
│  React Frontend                             │
│       │                                     │
│       ▼                                     │
│  Node.js API Server                         │
│       │                                     │
│       ├──────────────► PostgreSQL           │
│       │                  LOCAL               │
│       │                                     │
│       ├──────────────► Redis                │
│       │                  LOCAL               │
│       │                                     │
│       ├──────────────► Judge0 (Sandbox)     │
│       │                  LOCAL               │
│       │                                     │
│       ├──────────────► Local File Storage   │
│       │                                     │
│       └──────────────► AI Gateway           │
│                          EXTERNAL API        │
│                                             │
└─────────────────────────────────────────────┘
```

## Storage Volumes

- `postgres_data` — PostgreSQL database volume
- `redis_data` — Redis cache & Bull queue volume
- `app_storage` — Local file uploads (resumes, recordings, documents)