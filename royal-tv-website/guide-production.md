# 🏰 ROYAL TV PRODUCTION DEPLOYMENT & NGINX CONFIG CHEAT SHEET

## 🚦 **How This Works (High-level)**

* **Nginx** acts as a secure gateway. All public traffic (HTTP/HTTPS, WebSockets) goes through it.
* **HTTP (port 80) auto-redirects to HTTPS** for security and SEO.
* **HTTPS (port 443)** is fully set up with free Let's Encrypt SSL (Certbot).
* **WebSocket and special API routes** are sent to your Socket.IO server (`/socket.io/`, `/emit/`).
* **All other traffic** goes to your Next.js frontend (port 3000).
* **Backends (ports 3000, 3001) run only on localhost**—no need for their own HTTPS.

---

## 📝 **Nginx Config (Paste into `/etc/nginx/sites-available/royal-tv`)**

```nginx
# -----------------------------------------------
# 🚀 Nginx config for Royal TV (Next.js + Socket.IO)
# -----------------------------------------------

# 🌐 HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name royal-tv.tv www.royal-tv.tv;
    # 🔀 Redirect all HTTP requests to HTTPS
    return 301 https://royal-tv.tv$request_uri;
}

# 🔒 Main HTTPS block for Royal TV
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name royal-tv.tv www.royal-tv.tv;

    # 📄 SSL certs from Let's Encrypt (inserted by Certbot)
    ssl_certificate /etc/letsencrypt/live/royal-tv.tv/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/royal-tv.tv/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/royal-tv.tv/chain.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # 🖥️ WebSocket traffic for Socket.IO (to backend port 3001)
    location /socket.io/ {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        # 🪄 WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        # 🎯 Pass to Socket.IO server
        proxy_pass http://localhost:3001/socket.io/;
    }

    # 📡 Special HTTP API calls for Socket server
    location /emit/ {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_pass http://localhost:3001$request_uri;
    }

    # 🏠 All other traffic to Next.js frontend (port 3000)
    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        # 🧙 Allow WebSocket upgrades for Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_pass http://localhost:3000;
    }

    # 🗂️ File upload size limit (increase as needed)
    client_max_body_size 50M;

    # 🚫 (Optional security) Block hidden files and directories (like .git)
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

---

## 👩‍💻 **Production Server Commands (Ubuntu 24.04)**

### 🍃 1. **Update System and Install Essentials**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban nano htop
```

* // 🌱 Keep your server fresh & secure

---

### 🌐 2. **Install Nginx**

```bash
sudo apt install -y nginx
sudo systemctl enable nginx --now
sudo rm /etc/nginx/sites-enabled/default  # Remove default config
```

* // 🟩 Start and enable nginx for boot

---

### 🔑 3. **Firewall and Fail2Ban Security**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo systemctl enable fail2ban --now
```

* // 🔥 Protect your server from brute force

---

### 🟢 4. **Install Node.js (LTS), npm, and PM2**

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
```

* // 🚀 Runs your backend & frontend JS apps

---

### 🐘 5. **Install PostgreSQL & Create Database/User**

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
# In psql shell, run (one line at a time):
CREATE DATABASE royal_tv;
CREATE USER royaluser WITH ENCRYPTED PASSWORD 'Hnodri2529!';
GRANT ALL PRIVILEGES ON DATABASE royal_tv TO royaluser;
\c royal_tv
GRANT ALL ON SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO royaluser;
\q
```

* // 🛢️ Secure Postgres database for your project

---

### 📁 6. **App Upload & .env Setup**

```bash
cd ~
mkdir -p royal-tv
cd royal-tv
# Upload files here (use FileZilla, git, rsync, unzip, etc.)
mv .env.production .env  # Use production config
```

* // 🗂️ Prepares your project directory

---

### 📦 7. **Install Dependencies**

```bash
npm install
```

* // 📦 Installs node\_modules for the app

---

### 🛠️ 8. **Setup Database Schema (Prisma)**

```bash
npx prisma db push
```

* // 🧬 Syncs your database schema

---

### 🌱 9. **(Optional) Seed the Database**

```bash
node prisma/seed.js
```

* // 🌱 Adds initial data to your DB

---

### 🏗️ 10. **Build the Next.js Frontend**

```bash
npm run build
```

* // 🛠️ Optimizes the app for production

---

### 🚦 11. **Start App with PM2**

```bash
pm2 start server.js --name royal-tv-backend
pm2 start npm --name royal-tv-frontend -- start
pm2 save
pm2 startup  # Follow systemctl instructions printed!
```

### 🛠️ Edit your config ecosystem with pm2
```bash
pm2 reload ecosystem.config.cjs

pm2 delete all

pm2 start ecosystem.config.cjs
```

* // 🚦 PM2 keeps your apps running 24/7

---

### 🌍 12. **Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/royal-tv
# (Paste Nginx config above, save and exit)
sudo ln -s /etc/nginx/sites-available/royal-tv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

* // 🌍 Points traffic to your app

---

### 🔒 13. **Install SSL (Certbot + Let's Encrypt)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d royal-tv.tv -d www.royal-tv.tv
sudo systemctl reload nginx
```

* // 🔒 FREE HTTPS certificates, auto-renewed

---

### 🛡️ 14. **Test SSL Renewal**

```bash
sudo certbot renew --dry-run
```

* // 🛡️ Confirms auto-renew works

---

### 👀 15. **Monitor & Manage Your App**

```bash
pm2 list
pm2 logs royal-tv-frontend
pm2 logs royal-tv-backend
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
sudo lsof -i :443
```

* // 🕵️‍♂️ Check logs, services, ports

---

### 🟢 16. **Useful Shortcuts**

```bash
pm2 restart royal-tv-frontend
pm2 restart royal-tv-backend
pm2 stop royal-tv-frontend
pm2 stop royal-tv-backend
pm2 delete royal-tv-frontend
pm2 delete royal-tv-backend
```

* // ⚡️ Quick control for PM2 apps

---

### 🧹 17. **Clean Up / Extras**

* `sudo apt autoremove -y` // 🧹 Removes unused packages
* `sudo reboot` // 🔄 Reboots your server (when needed)

---

## ⚠️ **Notes and Best Practices**

* **Never expose ports 3000/3001 to the internet!**
  All traffic must go through Nginx for SSL/security.
* **Always test Nginx changes:**
  `sudo nginx -t && sudo systemctl reload nginx`
* **Update, upgrade, and check status often.**
* **Regularly check SSL renewals** to avoid downtime.

---

## 📚 **Extra: Why This Is Secure**

* **Frontend is always HTTPS.**
* **Backend is protected by Nginx and localhost-only.**
* **WebSocket traffic stays encrypted from client → Nginx → backend.**
* **You can always scale by moving socket server to its own machine—just update the Nginx `proxy_pass`!**

---

# -----------------------------------------------

# END OF ROYAL TV PRODUCTION & NGINX CHEAT SHEET

# -----------------------------------------------
