# -----------------------------------------------
# ROYAL TV PRODUCTION DEPLOYMENT COMMANDS CHEAT SHEET
# -----------------------------------------------

# 🍃 1. Update system and install essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban

# 🌐 2. Install nginx and enable
sudo apt install -y nginx
sudo systemctl enable nginx --now
sudo rm /etc/nginx/sites-enabled/default

# 🔑 3. Firewall setup (run after nginx is installed)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo systemctl enable fail2ban --now

# 🟩 4. Install Node.js (LTS) and PM2
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v

# 🐘 5. Install PostgreSQL and setup database/user
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
# Inside psql prompt:
# (copy each line, press Enter after each)
CREATE DATABASE royal_tv;
CREATE USER royaluser WITH ENCRYPTED PASSWORD 'Hnodri2529!';
GRANT ALL PRIVILEGES ON DATABASE royal_tv TO royaluser;
\c royal_tv
GRANT ALL ON SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO royaluser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO royaluser;
\q

# 🗂️ 6. Upload your app to server (~/royal-tv), set up .env
cd ~
mkdir -p royal-tv
cd royal-tv
# (Upload your files here, e.g., with FileZilla, git, or unzip)

# Rename .env.production to .env for production use
mv .env.production .env

# 📦 7. Install node dependencies
npm install

# 🛠️ 8. Prisma: Create DB tables from schema
npx prisma db push

# 🌱 9. (Optional) Seed the database
node prisma/seed.js

# 🏗️ 10. Build the Next.js frontend
npm run build

# 🚦 11. Start backend and frontend with PM2
pm2 start server.js --name royal-tv-backend
pm2 start npm --name royal-tv-frontend -- start
pm2 save
pm2 startup  # (Follow the instructions shown for systemctl enable)

# 🌍 12. Nginx: Create config for your site
sudo nano /etc/nginx/sites-available/royal-tv
# (Paste in your nginx config, save and exit)
sudo ln -s /etc/nginx/sites-available/royal-tv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 🔒 13. Install Certbot and get Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d royal-tv.tv -d www.royal-tv.tv
sudo systemctl reload nginx

# 🛡️ 14. Test SSL renewal
sudo certbot renew --dry-run

# 👀 15. Monitor logs and processes
pm2 list
pm2 logs royal-tv-frontend
pm2 logs royal-tv-backend

# 🟢 16. Useful shortcuts
pm2 restart royal-tv-frontend
pm2 restart royal-tv-backend
sudo nginx -t
sudo systemctl reload nginx
sudo lsof -i :443

# 🚦 17. (Optional) Add HTTP to HTTPS redirect in nginx
# Add this to /etc/nginx/sites-available/royal-tv above other server blocks:
server {
    listen 80;
    server_name royal-tv.tv www.royal-tv.tv;
    return 301 https://$host$request_uri;
}

# -----------------------------------------------
# END OF ROYAL TV DEPLOYMENT CHEAT SHEET
# -----------------------------------------------
