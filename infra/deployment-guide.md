# Deployment Guide (VPS + SSL)

## Step 1 — Provision Server

Recommended:
- Ubuntu 22.04
- 2GB RAM minimum
- Docker installed

---

## Step 2 — Install Docker

sudo apt update
sudo apt install docker.io docker-compose -y

Enable Docker:

sudo systemctl enable docker

---

## Step 3 — Clone Project

git clone your_repo_url
cd project-root/docker

---

## Step 4 — Build Sandbox Image

docker build -t secure-python-sandbox -f sandbox.Dockerfile .

---

## Step 5 — Start Services

docker-compose up -d --build

---

## Step 6 — Setup Nginx Reverse Proxy

Install Nginx:

sudo apt install nginx

Example config:

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

Restart:

sudo systemctl restart nginx

---

## Step 7 — Enable SSL (Certbot)

sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx

---

## Step 8 — Production Checklist

- Replace development JWT secrets
- Enable secure cookies
- Use HTTPS only
- Set CORS restrictions
- Disable debug logs
- Set proper memory limits
- Enable firewall
- Monitor logs

---

## Scaling Next

For scaling:
- Add Redis queue
- Multiple worker replicas
- Add load balancer
- Migrate to Kubernetes