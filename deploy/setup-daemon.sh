#!/bin/bash
# NexusBank Daemon Setup Script
# Run this on the VPS to configure PM2 auto-start + watchdog cron.
# Usage: bash /www/wwwroot/nexusbankuk.com/deploy/setup-daemon.sh

set -e

APP_DIR="/www/wwwroot/nexusbankuk.com"
APP_NAME="nexusbank"

echo "=== NexusBank Daemon Setup ==="
echo ""

# Ensure logs directory exists
mkdir -p "$APP_DIR/logs"

# ── Step 1: Stop existing PM2 process if running ──
echo "[1/5] Stopping existing PM2 process..."
pm2 delete "$APP_NAME" 2>/dev/null || true

# ── Step 2: Start app with ecosystem config ──
echo "[2/5] Starting app with ecosystem config..."
cd "$APP_DIR"
pm2 start ecosystem.config.js
echo "  App started on port 3001."

# ── Step 3: Configure PM2 to start on boot ──
echo "[3/5] Configuring PM2 startup on boot..."
pm2 startup systemd -u root --hp /root
pm2 save
echo "  PM2 will auto-start on reboot."

# ── Step 4: Set up watchdog cron ──
echo "[4/5] Setting up watchdog cron (every 3 minutes)..."
chmod +x "$APP_DIR/deploy/watchdog.sh"

# Add cron entry if not already present
CRON_CMD="*/3 * * * * $APP_DIR/deploy/watchdog.sh >> $APP_DIR/logs/watchdog.log 2>&1"
(crontab -l 2>/dev/null | grep -v "watchdog.sh" ; echo "$CRON_CMD") | crontab -
echo "  Watchdog cron installed."

# ── Step 5: Verify ──
echo "[5/5] Verifying..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:3001)
if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 500 ]; then
    echo "  App is responding (HTTP $STATUS)."
else
    echo "  Warning: App returned HTTP $STATUS. Check logs at $APP_DIR/logs/"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "PM2 process:  pm2 status"
echo "PM2 logs:     pm2 logs nexusbank"
echo "Watchdog log: tail -f $APP_DIR/logs/watchdog.log"
echo "Restart:      pm2 restart nexusbank"
echo ""
echo "Your app will now:"
echo "  - Auto-restart on crash (PM2)"
echo "  - Auto-start on server reboot (PM2 startup)"
echo "  - Health-check every 3 minutes (watchdog cron)"
echo "  - Restart if memory exceeds 512MB (PM2)"
