# Hostinger Deployment Guide for Prime Platform

## Prerequisites
- Hostinger VPS or Cloud Hosting plan (Node.js support required)
- Domain configured with Hostinger
- SSH access to your server

## Environment Variables

Create a `.env` file on your Hostinger server with these variables:

```env
# Database (Use Hostinger MySQL or external PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/prime_db?schema=public"

# Or for MySQL on Hostinger:
# DATABASE_URL="mysql://username:password@localhost:3306/prime_db"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-generate-with-openssl"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth (Google Sign In)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File Upload
USE_FILE_STORAGE=true

# Payment Processing
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Use Hostinger's SMTP or external)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"

# Application
NODE_ENV=production
```

## Deployment Steps

### Option 1: Hostinger VPS (Recommended for Full Control)

1. **Connect via SSH**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js (v18+)**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 for process management**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone and setup your project**
   ```bash
   cd /var/www
   git clone your-repo-url prime
   cd prime
   npm install
   ```

5. **Setup environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

6. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

7. **Build the application**
   ```bash
   npm run build
   ```

8. **Create uploads directory**
   ```bash
   mkdir -p public/uploads/{avatars,covers,posts,videos,kyc,misc}
   chmod -R 755 public/uploads
   ```

9. **Start with PM2**
   ```bash
   pm2 start npm --name "prime" -- start
   pm2 save
   pm2 startup
   ```

10. **Setup Nginx reverse proxy**
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name yourdomain.com;
        
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        
        # Increase max upload size for videos
        client_max_body_size 500M;
        
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Increase timeouts for large uploads
            proxy_connect_timeout 600;
            proxy_send_timeout 600;
            proxy_read_timeout 600;
        }
        
        # Serve uploaded files directly
        location /uploads {
            alias /var/www/prime/public/uploads;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    ```

11. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

### Option 2: Hostinger Cloud Hosting with Node.js

1. **Access hPanel** and go to **Website > Node.js**

2. **Create Node.js Application**
   - Node.js version: 18.x or higher
   - Application root: `/public_html/prime`
   - Application URL: Your domain
   - Application startup file: `server.js`

3. **Upload files** via File Manager or FTP

4. **Create a `server.js` file** in your project root:
   ```javascript
   const { createServer } = require('http')
   const { parse } = require('url')
   const next = require('next')
   
   const dev = false
   const hostname = '0.0.0.0'
   const port = process.env.PORT || 3000
   
   const app = next({ dev, hostname, port })
   const handle = app.getRequestHandler()
   
   app.prepare().then(() => {
     createServer(async (req, res) => {
       try {
         const parsedUrl = parse(req.url, true)
         await handle(req, res, parsedUrl)
       } catch (err) {
         console.error('Error occurred handling', req.url, err)
         res.statusCode = 500
         res.end('internal server error')
       }
     }).listen(port, (err) => {
       if (err) throw err
       console.log(`> Ready on http://${hostname}:${port}`)
     })
   })
   ```

5. **Set environment variables** in hPanel

6. **Restart the Node.js application**

## Database Options

### Option A: External PostgreSQL (Recommended)
Use services like:
- **Neon** (Free tier available)
- **Supabase** (Free tier available)
- **Railway** (PostgreSQL)
- **PlanetScale** (MySQL)

### Option B: Hostinger MySQL
1. Create database in hPanel
2. Update DATABASE_URL to MySQL format
3. Update Prisma schema provider to `mysql`

## Post-Deployment Checklist

- [ ] Database connected and migrated
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] File uploads working
- [ ] Email sending configured
- [ ] Payment webhooks configured
- [ ] Domain DNS pointing to server

## Troubleshooting

### Upload Issues
- Check `public/uploads` directory permissions (755)
- Verify Nginx `client_max_body_size` setting
- Check disk space on server

### Database Connection
- Verify DATABASE_URL is correct
- Check firewall allows database port
- Test connection with `npx prisma db pull`

### Build Errors
- Ensure Node.js version matches (18+)
- Run `npm install` with `--legacy-peer-deps` if needed
- Check for missing environment variables

## Useful Commands

```bash
# View logs
pm2 logs prime

# Restart application
pm2 restart prime

# Check status
pm2 status

# Update application
git pull
npm install
npm run build
pm2 restart prime
```

## Support

For Hostinger-specific issues, contact their support or check:
- https://support.hostinger.com/
- https://www.hostinger.com/tutorials/
