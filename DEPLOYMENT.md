# Deployment Guide - Washington Gaming Forum

## Prerequisites

- Docker and Docker Compose installed
- Domain configured (forum.washington.com)
- SSL certificate (recommended: Let's Encrypt)
- Backend API deployed and running

## Production Deployment

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd washington-forum
```

2. **Create production environment file**
```bash
cp .env.example .env.production
```

Edit `.env.production`:
```env
VITE_API_URL=https://api.washington.com/api/v1
VITE_APP_URL=https://forum.washington.com
```

3. **Build Docker image**
```bash
docker build -t washington-forum:latest .
```

4. **Run container**
```bash
docker run -d \
  --name washington-forum \
  -p 80:80 \
  --restart unless-stopped \
  washington-forum:latest
```

### Option 2: Docker Compose

1. **Update docker-compose.yml** with production values

2. **Start services**
```bash
docker-compose up -d
```

3. **Check logs**
```bash
docker-compose logs -f frontend
```

### Option 3: Manual Deployment

1. **Build the application**
```bash
npm install
npm run build
```

2. **Copy dist/ folder to server**
```bash
scp -r dist/* user@server:/var/www/forum.washington.com/
```

3. **Configure Nginx** (see nginx-production.conf below)

4. **Restart Nginx**
```bash
sudo systemctl restart nginx
```

## Nginx Configuration (Production)

Create `/etc/nginx/sites-available/forum.washington.com`:

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name forum.washington.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name forum.washington.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/forum.washington.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forum.washington.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Root directory
    root /var/www/forum.washington.com;
    index index.html;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.washington.com;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.(css|js)$ {
        expires 1M;
        add_header Cache-Control "public";
    }
    
    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # API proxy
    location /api {
        proxy_pass https://api.washington.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://forum.washington.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/forum.washington.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d forum.washington.com
```

## Environment Variables

### Development
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_URL=http://localhost:3000
```

### Production
```env
VITE_API_URL=https://api.washington.com/api/v1
VITE_APP_URL=https://forum.washington.com
VITE_DISCORD_CLIENT_ID=your_production_client_id
```

## Monitoring

### Health Check

```bash
curl https://forum.washington.com/health
```

### Docker Logs

```bash
docker logs -f washington-forum
```

### Nginx Logs

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Performance Optimization

1. **Enable Brotli compression** (requires nginx module)
2. **Configure CDN** (CloudFlare recommended)
3. **Enable HTTP/3** (QUIC)
4. **Set up caching headers**
5. **Optimize images** (WebP format)

## Backup Strategy

1. **Database backups** (handled by backend)
2. **Static assets backup**
```bash
tar -czf forum-backup-$(date +%Y%m%d).tar.gz /var/www/forum.washington.com/
```

## Rollback Procedure

1. **Stop current container**
```bash
docker stop washington-forum
```

2. **Run previous version**
```bash
docker run -d \
  --name washington-forum \
  -p 80:80 \
  washington-forum:previous-version
```

## Troubleshooting

### Issue: 502 Bad Gateway
**Solution**: Check if backend API is running and accessible

### Issue: Assets not loading
**Solution**: Check nginx configuration and file permissions

### Issue: Slow loading
**Solution**: Enable gzip/brotli compression, check CDN configuration

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled (on API)
- [ ] Firewall rules configured
- [ ] Regular updates scheduled
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

## Post-Deployment

1. **Test all functionality**
    - User registration/login
    - Thread creation
    - Forum navigation
    - Search functionality
    - Mobile responsiveness

2. **Performance testing**
    - Page load times
    - API response times
    - Load testing

3. **Monitor for errors**
    - Check error logs
    - Set up error tracking (Sentry recommended)

## Contact

For deployment support, contact the DevOps team.