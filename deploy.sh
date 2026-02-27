#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════
# NexusBank — Full VPS Deployment Script
# Domain: nexusbankuk.com
# Server: 173.46.80.218
# ═══════════════════════════════════════════════════════════════════════
# SSH into your server first:   ssh root@173.46.80.218
# Then paste this entire script.
# ═══════════════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════"
echo " NexusBank Deployment Starting..."
echo "══════════════════════════════════════════════"

# ── 1. Install Node.js 22.x ──────────────────────────────────────────
echo "[1/7] Installing Node.js 22..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  Node: $(node -v)  npm: $(npm -v)"

# ── 2. Install PM2 (process manager) ─────────────────────────────────
echo "[2/7] Installing PM2..."
npm install -g pm2 2>/dev/null || true
echo "  PM2: $(pm2 -v)"

# ── 3. Clone the repository ──────────────────────────────────────────
echo "[3/7] Cloning repository..."
APP_DIR="/www/wwwroot/nexusbankuk.com"
mkdir -p "$APP_DIR"

# Clean out any existing files (but not hidden git dir if exists)
if [ -d "$APP_DIR/.git" ]; then
  echo "  Git repo already exists, pulling latest..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  # Remove any default placeholder files
  rm -rf "${APP_DIR:?}"/*
  cd "$APP_DIR"
  git clone https://github.com/wchloe7964/nexusbank.git .
fi

# ── 4. Create environment file ───────────────────────────────────────
echo "[4/7] Writing .env.local..."
cat > "$APP_DIR/.env.local" << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://dwrmifbyhsbwkcmudqic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cm1pZmJ5aHNid2tjbXVkcWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTE5NjUsImV4cCI6MjA4NzI4Nzk2NX0.QREBoD0mV5gzbTfMOcb7fciodnMZMboZrkimKm8P8Pw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cm1pZmJ5aHNid2tjbXVkcWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcxMTk2NSwiZXhwIjoyMDg3Mjg3OTY1fQ.l7GkSWnQjE0Z7jrW6tcwm74IW0MUxtCRCw2PKKlOE3g
SUPABASE_ACCESS_TOKEN=sbp_c492015b9901161be6405a5fb623580767b5ce40
NEXT_PUBLIC_SITE_URL=https://nexusbankuk.com
NEXT_PUBLIC_DEMO_MODE=false
ENVEOF
chmod 600 "$APP_DIR/.env.local"

# ── 5. Install dependencies and build ────────────────────────────────
echo "[5/7] Installing dependencies & building..."
cd "$APP_DIR"
npm ci --production=false
npm run build

# ── 6. Start with PM2 ────────────────────────────────────────────────
echo "[6/7] Starting app with PM2..."
pm2 delete nexusbank 2>/dev/null || true
pm2 start npm --name "nexusbank" -- start -- -p 3000
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ── 7. Configure Nginx ───────────────────────────────────────────────
echo "[7/7] Configuring Nginx..."

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi

cat > /etc/nginx/sites-available/nexusbankuk.com << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name nexusbankuk.com www.nexusbankuk.com;

    # Redirect www to non-www
    if ($host = www.nexusbankuk.com) {
        return 301 https://nexusbankuk.com$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /images {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
NGINXEOF

# Enable the site
ln -sf /etc/nginx/sites-available/nexusbankuk.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# If aaPanel manages nginx, also write to its conf dir
if [ -d "/www/server/panel/vhost/nginx" ]; then
  cp /etc/nginx/sites-available/nexusbankuk.com /www/server/panel/vhost/nginx/nexusbankuk.com.conf
fi

nginx -t && systemctl reload nginx

# ── 8. SSL with Let's Encrypt ────────────────────────────────────────
echo "[BONUS] Setting up SSL..."
if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi
certbot --nginx -d nexusbankuk.com -d www.nexusbankuk.com --non-interactive --agree-tos --email admin@nexusbankuk.com --redirect || {
  echo "  ⚠ SSL setup failed - DNS may not have propagated yet."
  echo "  Run this later: certbot --nginx -d nexusbankuk.com -d www.nexusbankuk.com"
}

echo ""
echo "══════════════════════════════════════════════"
echo " ✅ Deployment Complete!"
echo "══════════════════════════════════════════════"
echo ""
echo " Your app is live at:"
echo "   http://nexusbankuk.com"
echo "   https://nexusbankuk.com (if SSL succeeded)"
echo ""
echo " Useful commands:"
echo "   pm2 status          — check app status"
echo "   pm2 logs nexusbank  — view app logs"
echo "   pm2 restart nexusbank — restart the app"
echo ""
echo " To redeploy after code changes:"
echo "   cd $APP_DIR && git pull && npm ci && npm run build && pm2 restart nexusbank"
echo ""
