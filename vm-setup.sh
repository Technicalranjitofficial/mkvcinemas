#!/usr/bin/env bash
# =============================================================================
# vm-setup.sh — One-time VM bootstrap for MKVCinemas
# Tested on Ubuntu 22.04 / 24.04 LTS
# Run as root or a sudo-capable user:  bash vm-setup.sh
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"          # optional: pass your domain as first argument
APP_DIR="/opt/mkvcinemas"

log() { echo -e "\n\033[1;34m==>\033[0m $*"; }

# ─────────────────────────────────────────────────────────────────────────────
# 1. System update
# ─────────────────────────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git openssl ufw

# ─────────────────────────────────────────────────────────────────────────────
# 2. Firewall
# ─────────────────────────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─────────────────────────────────────────────────────────────────────────────
# 3. Docker + Docker Compose
# ─────────────────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    # Allow the current non-root user to run docker
    usermod -aG docker "${SUDO_USER:-$USER}" || true
else
    log "Docker already installed: $(docker --version)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Certbot (Let's Encrypt SSL)
# ─────────────────────────────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
    log "Installing Certbot..."
    apt-get install -y certbot
else
    log "Certbot already installed."
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. Clone / copy project
# ─────────────────────────────────────────────────────────────────────────────
log "Creating app directory at $APP_DIR ..."
mkdir -p "$APP_DIR"
echo "  >> Copy your project files to $APP_DIR or clone your repo here."
echo "     Example:  git clone https://github.com/your-user/mkvcinemas.git $APP_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# 6. Environment file
# ─────────────────────────────────────────────────────────────────────────────
log "Setting up .env ..."
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/.env.example" ]; then
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        echo "  >> .env created from .env.example — fill in all values before running docker compose."
    else
        echo "  >> No .env.example found — create $APP_DIR/.env manually."
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Obtain SSL certificate  (skip if no domain provided)
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$DOMAIN" ]; then
    log "Requesting Let's Encrypt certificate for $DOMAIN ..."
    # Port 80 must be reachable and not occupied
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "admin@${DOMAIN}" \
        -d "$DOMAIN"

    log "Setting up Certbot auto-renewal cron..."
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker exec mkvcinemas_nginx nginx -s reload") | crontab -

    # Patch nginx.conf with the real domain
    if [ -f "$APP_DIR/nginx/nginx.conf" ]; then
        sed -i "s/YOUR_DOMAIN\.COM/$DOMAIN/g" "$APP_DIR/nginx/nginx.conf"
        log "nginx.conf updated with domain: $DOMAIN"
    fi
else
    log "No domain provided — skipping SSL certificate issuance."
    echo "  >> Run later:  certbot certonly --standalone -d your-domain.com"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 8. Done
# ─────────────────────────────────────────────────────────────────────────────
log "VM bootstrap complete!"
echo ""
echo "  Next steps:"
echo "  1. cd $APP_DIR"
echo "  2. Edit .env with your real values"
echo "  3. docker compose build --no-cache"
echo "  4. docker compose up -d"
echo "  5. Check logs: docker compose logs -f app"
