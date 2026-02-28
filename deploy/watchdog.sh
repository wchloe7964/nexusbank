#!/bin/bash
# NexusBank Watchdog Script
# Checks if the app is responding and restarts PM2 process if not.
# Add to cron: */3 * * * * /www/wwwroot/nexusbankuk.com/deploy/watchdog.sh >> /www/wwwroot/nexusbankuk.com/logs/watchdog.log 2>&1

APP_NAME="nexusbank"
APP_URL="http://127.0.0.1:3001"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
MAX_RETRIES=2
RETRY_DELAY=5

check_health() {
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL")
    if [ "$status" -ge 200 ] && [ "$status" -lt 500 ]; then
        return 0
    fi
    return 1
}

check_pm2_process() {
    pm2 describe "$APP_NAME" > /dev/null 2>&1
    return $?
}

restart_app() {
    echo "$LOG_PREFIX Restarting $APP_NAME via PM2..."
    pm2 restart "$APP_NAME" --update-env
    sleep 10

    if check_health; then
        echo "$LOG_PREFIX App restarted successfully and responding."
        return 0
    else
        echo "$LOG_PREFIX App restarted but not yet responding. Will check next cycle."
        return 1
    fi
}

start_app() {
    echo "$LOG_PREFIX Starting $APP_NAME via PM2 ecosystem config..."
    cd /www/wwwroot/nexusbankuk.com
    pm2 start ecosystem.config.js
    pm2 save
    sleep 10

    if check_health; then
        echo "$LOG_PREFIX App started successfully and responding."
        return 0
    else
        echo "$LOG_PREFIX App started but not yet responding."
        return 1
    fi
}

# Main watchdog logic
if ! check_pm2_process; then
    echo "$LOG_PREFIX PM2 process '$APP_NAME' not found. Starting..."
    start_app
    exit $?
fi

# Check if app is responding
for i in $(seq 1 $MAX_RETRIES); do
    if check_health; then
        exit 0
    fi
    if [ $i -lt $MAX_RETRIES ]; then
        echo "$LOG_PREFIX Health check failed (attempt $i/$MAX_RETRIES). Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi
done

echo "$LOG_PREFIX App is unresponsive after $MAX_RETRIES attempts."
restart_app
