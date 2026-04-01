# Production Architecture

## Overview

The Intelligent Python Code Review Platform consists of:

- React Frontend
- Express Backend (API Gateway)
- FastAPI Worker (Compute Engine)
- MongoDB
- Ollama AI Engine
- Secure Docker Sandbox

---

## System Flow

1. User submits code via frontend.
2. Backend creates submission entry.
3. Backend emits WebSocket event (Started).
4. Backend calls Worker.
5. Worker:
   - AST analysis
   - Static analysis
   - Docker sandbox execution
   - Plagiarism detection (FAISS)
   - AI feedback (Ollama)
6. Worker returns structured result.
7. Backend updates DB.
8. Backend emits WebSocket completion event.
9. Frontend updates in real-time.

---

## Security Layers

- JWT Access + Refresh Tokens
- Role-based access control
- Email verification
- Docker container isolation
- CPU and memory restrictions
- Network disabled in sandbox
- AST normalization for plagiarism detection

---

## Scaling Strategy

Future horizontal scaling:

- Multiple Worker replicas
- Redis queue system
- Load balancer (Nginx)
- MongoDB replica set
- Kubernetes orchestration

---

## Persistent Storage

- MongoDB volume
- Ollama model storage volume
- FAISS index file

---

## Monitoring (Future)

- Prometheus
- Grafana
- Centralized logging