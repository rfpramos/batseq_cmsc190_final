# DigitalOcean Droplet Setup

This setup keeps the frontend and backend on the same Droplet.

## Backend

```bash
cd ~/batseq_cmsc190_final
docker build -t batseq-backend ./backend
docker rm -f batseq-backend 2>/dev/null || true
docker run -d --name batseq-backend --restart unless-stopped --network host \
  -e DB_HOST=127.0.0.1 -e DB_PORT=3306 -e DB_USER=batseq_user -e DB_PASSWORD='YOUR_PASSWORD' \
  -e DB_NAME=cinterlabs -e PORT=5000 batseq-backend
```

## Frontend

```bash
cd ~/batseq_cmsc190_final/frontend
npm install
npm run build
sudo mkdir -p /var/www/batseq/frontend
sudo rsync -a --delete build/ /var/www/batseq/frontend/build/
```

## nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo cp ~/batseq_cmsc190_final/deploy/droplet-nginx.conf /etc/nginx/sites-available/batseq
sudo ln -sf /etc/nginx/sites-available/batseq /etc/nginx/sites-enabled/batseq
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

## Verify

```bash
curl http://127.0.0.1:5000/api/health
curl http://YOUR_DROPLET_IP/
```