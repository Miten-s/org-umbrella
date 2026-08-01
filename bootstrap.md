`
#!/bin/bash
set -e

echo "Starting EC2 bootstrap..."

############################################
# Update packages2
############################################
apt-get update -y
apt-get upgrade -y

############################################
# Install utilities
############################################
apt-get install -y \
    curl \
    git \
    unzip \
    build-essential

############################################
# Install Node.js LTS
############################################
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

############################################
# Install PM2
############################################
npm install -g pm2 pnpm

############################################
# Install Nginx
############################################
apt-get install -y nginx

systemctl enable nginx
systemctl start nginx

############################################
# Nginx Configuration
############################################

cat >/etc/nginx/sites-available/default <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 50M;

    root /var/www/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    ####################################################
    # Backend Service (Port 9000)
    ####################################################
    location /api/ {

        proxy_pass http://127.0.0.1:9000/;

        proxy_http_version 1.1;

        # WebSocket Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Preserve original request
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Authentication
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Cookie $http_cookie;

        proxy_cache_bypass $http_authorization;
        proxy_cache_bypass $http_cookie;

        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }

    ####################################################
    # GXP Service (Port 9001)
    ####################################################
    location /gxp/ {

        proxy_pass http://127.0.0.1:9001/;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header Authorization $http_authorization;
        proxy_set_header Cookie $http_cookie;

        proxy_cache_bypass $http_authorization;
        proxy_cache_bypass $http_cookie;

        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }

    ####################################################
    # Health Check
    ####################################################
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

############################################
# Validate Nginx
############################################
nginx -t

systemctl restart nginx
systemctl enable nginx

############################################
# Configure PM2 Startup
############################################

PM2_STARTUP=$(pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1)
eval "$PM2_STARTUP" || true

echo "Bootstrap completed successfully."
`