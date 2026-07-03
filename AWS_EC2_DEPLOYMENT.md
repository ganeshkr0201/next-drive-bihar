# NextDrive Bihar — Backend Deployment on AWS EC2

> **Goal:** Deploy the Node.js backend on a free-tier eligible EC2 instance using the $100 credit, with budget protection so you never get an unexpected bill.

---

## ⚠️ IMPORTANT — Read First (Bill Protection)

- The **$100 credit** is applied to your account automatically after signing up. Every AWS service you use is deducted from this credit first — you are not charged directly until the credit runs out.
- Set a **billing alert immediately** after account creation (Step 1 covers this). This is the single most important thing to protect you.
- Use **t2.micro or t3.micro** (free-tier eligible). Never launch a larger instance unless you understand the cost.
- **Stop the instance** when not in use if you're just testing. A stopped instance costs ~$0/month for compute (you only pay for the EBS storage, which is ~$0.10/GB/month — nearly nothing).

---

## Step 1 — AWS Account Setup & Budget Alert

### 1.1 Create AWS Account
1. Go to [https://aws.amazon.com](https://aws.amazon.com) → Click **Create an AWS Account**
2. Enter email, password, account name
3. Choose **Personal** account type
4. Add a credit/debit card (required by AWS, but the $100 credit covers costs — your card is only charged if you exceed the credit)
5. Complete phone verification
6. Choose **Basic Support** (free)

### 1.2 Set Billing Alert — DO THIS BEFORE ANYTHING ELSE
1. Go to **AWS Console** → top-right menu → your account name → **Billing and Cost Management**
2. In the left sidebar → **Budgets** → **Create Budget**
3. Choose **Use a template** → **Zero spend budget**
   - This alerts you the moment you spend even $0.01 beyond the free tier
4. Enter your email → **Create Budget**
5. Also create a second budget:
   - **Monthly cost budget** → set threshold to **$50** (half your credit)
   - This warns you before you use half the credit
6. **Enable Free Tier Alerts:**
   - Billing → **Billing Preferences** → check **Receive Free Tier Usage Alerts** → save

---

## Step 2 — Launch EC2 Instance

### 2.1 Go to EC2 Dashboard
1. AWS Console → search **EC2** → **Launch Instance**

### 2.2 Configure the instance

| Setting | Value |
|---------|-------|
| Name | `nextdrive-backend` |
| AMI | **Ubuntu Server 22.04 LTS (HVM), SSD** — look for the "Free tier eligible" label |
| Architecture | 64-bit (x86) |
| Instance type | **t2.micro** (free tier eligible — 1 vCPU, 1 GB RAM) |
| Key pair | Click **Create new key pair** → name it `nextdrive-key` → RSA → .pem format → Download it |
| Storage | 8 GB gp3 (default — free tier gives 30 GB, so 8 GB is fine) |

> **Save the .pem file somewhere safe on your Mac** — you cannot download it again.

### 2.3 Network settings (Security Group)
Click **Edit** on Network settings. Add these inbound rules:

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | My IP | Secure SSH access |
| Custom TCP | 4000 | 0.0.0.0/0 | Your backend port |
| HTTPS | 443 | 0.0.0.0/0 | If you add SSL later |
| HTTP | 80 | 0.0.0.0/0 | Optional |

### 2.4 Launch
Click **Launch Instance** → wait ~1 minute for it to start.

---

## Step 3 — Connect to Your Instance

### 3.1 Get the public IP
EC2 Dashboard → Instances → click your instance → copy **Public IPv4 address**

### 3.2 SSH from your Mac terminal
```bash
# Fix key permissions (required by SSH)
chmod 400 ~/Downloads/nextdrive-key.pem

# Connect (replace YOUR_EC2_IP with the actual IP)
ssh -i ~/Downloads/nextdrive-key.pem ubuntu@YOUR_EC2_IP
```

You should see a welcome message. You are now inside the server.

---

## Step 4 — Install Node.js & PM2 on the Server

Run these commands one by one inside the SSH session:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # should print v20.x.x
npm --version     # should print 10.x.x

# Install PM2 globally (process manager — keeps your app running)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

## Step 5 — Upload Your Backend Code

You have two options. **Option A** (recommended) uses Git. **Option B** uses direct file copy.

### Option A — Clone from GitHub (recommended)

If your repo is on GitHub:
```bash
# On the server
cd ~
git clone https://github.com/YOUR_USERNAME/next-drive.git
cd next-drive/backend
npm install
```

### Option B — Copy files from your Mac using SCP

Run this on your **Mac terminal** (not the server):
```bash
# Copy the entire backend folder to the server
scp -i ~/Downloads/nextdrive-key.pem -r /Users/ganeshkumar/Desktop/next-drive/backend ubuntu@YOUR_EC2_IP:~/backend

# Then SSH in and install dependencies
ssh -i ~/Downloads/nextdrive-key.pem ubuntu@YOUR_EC2_IP
cd ~/backend
npm install
```

---

## Step 6 — Create the Production .env File

On the server, create the environment file:

```bash
cd ~/backend   # or ~/next-drive/backend if you used Git

# Create and edit the .env file
nano .env
```

Paste your production environment variables (copy from your local `.env.production` and update values as needed):

```env
PORT=4000
NODE_ENV=production
CLIENT_URL=https://nextdrivebihar.com

MONGO_URI=mongodb+srv://YOUR_ATLAS_CONNECTION_STRING

JWT_SECRET=your_production_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

PASSPORT_SECRET=your_passport_secret

EMAIL_USER=nextdrivebihar.info@gmail.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AUTH_CALLBACK=https://YOUR_EC2_IP_OR_DOMAIN/auth/google/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Save and exit: `Ctrl+O` → Enter → `Ctrl+X`

> ⚠️ **Never commit this .env file to Git.** It is already in `.gitignore`.

---

## Step 7 — Test the App Manually

Before setting up PM2, run the app manually to catch any errors:

```bash
cd ~/backend   # or ~/next-drive/backend

# Run it directly
node index.js
```

You should see:
```
🌐 Client URL: https://nextdrivebihar.com
📊 Environment: production
```

Test it from your browser or Postman:
```
http://YOUR_EC2_IP:4000/
```

You should get a JSON response. If it works, press `Ctrl+C` to stop it.

---

## Step 8 — Run with PM2 (Keep App Running 24/7)

```bash
cd ~/backend   # or ~/next-drive/backend

# Start the app with PM2
pm2 start index.js --name "nextdrive-backend"

# Check it's running
pm2 status

# View live logs
pm2 logs nextdrive-backend

# Make PM2 restart on server reboot
pm2 startup
# PM2 will print a command — copy and run it exactly as shown
pm2 save
```

Your backend is now running and will automatically restart if the server reboots.

---

## Step 9 — Update Frontend API URL

Update your frontend `.env.production` to point to the EC2 server:

```env
VITE_API_URL=http://YOUR_EC2_IP:4000
```

Or if you add a domain with SSL:
```env
VITE_API_URL=https://api.nextdrivebihar.com
```

Rebuild and redeploy the frontend to Vercel/Netlify after this change.

---

## Step 10 — (Optional) Add a Domain & HTTPS with Nginx + Certbot

If you have a domain (e.g., `api.nextdrivebihar.com`), here's how to add SSL for free:

### 10.1 Point your domain to EC2
In your domain registrar (GoDaddy / Cloudflare etc.):
- Add an **A record**: `api` → `YOUR_EC2_PUBLIC_IP`

### 10.2 Install Nginx as a reverse proxy
```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/nextdrive
```

Paste this:
```nginx
server {
    listen 80;
    server_name api.nextdrivebihar.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/nextdrive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for free SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.nextdrivebihar.com
```

Follow the prompts — Certbot will automatically configure HTTPS. Done!

---

## Useful PM2 Commands (Daily Use)

```bash
pm2 status                          # check if app is running
pm2 logs nextdrive-backend          # view logs
pm2 restart nextdrive-backend       # restart after code changes
pm2 stop nextdrive-backend          # stop the app
pm2 delete nextdrive-backend        # remove from PM2
```

## Updating Your Code (After Changes)

### If using Git:
```bash
cd ~/next-drive/backend
git pull origin main
npm install   # only if package.json changed
pm2 restart nextdrive-backend
```

### If using SCP:
```bash
# On your Mac:
scp -i ~/Downloads/nextdrive-key.pem -r /Users/ganeshkumar/Desktop/next-drive/backend ubuntu@YOUR_EC2_IP:~/backend
# Then on server:
pm2 restart nextdrive-backend
```

---

## Cost Breakdown (With $100 Credit)

| Service | Instance | Monthly Cost | From Credit |
|---------|----------|-------------|-------------|
| EC2 t2.micro | 24/7 running | ~$8.50/month | Yes |
| EBS storage (8 GB) | gp3 | ~$0.64/month | Yes |
| Data transfer | first 100 GB | Free | — |
| **Total** | | **~$9/month** | **~11 months of credit** |

> The $100 credit will last approximately **10–11 months** for this setup. After that, you pay ~$9/month.

### To stretch the credit further:
- **Stop the instance** when not in active use (e.g., nights/weekends during development)
- Use **t3.micro** instead of t2.micro in regions where it's cheaper
- Keep the EBS volume at 8 GB (don't increase unless needed)
- MongoDB Atlas free tier (M0) is already free — don't upgrade it
- Upstash Redis free tier is already free

---

## Emergency: How to Stop All Charges Immediately

If you ever want to stop all charges:

1. EC2 → Instances → select instance → **Actions → Instance State → Terminate**
   - Terminating deletes the instance and stops all charges
2. EC2 → Volumes → delete any remaining EBS volumes
3. Check **EC2 → Elastic IPs** — release any allocated IPs (they cost $0.005/hr if not attached)

> **Stopping vs Terminating:** Stopping keeps the instance (good for temporary pause, EBS storage still costs). Terminating deletes everything (good for permanent shutdown).

---

## Quick Reference Checklist

- [ ] AWS account created
- [ ] Budget alert set ($0 zero-spend + $50 halfway alert)
- [ ] Free tier usage alerts enabled
- [ ] EC2 t2.micro launched with Ubuntu 22.04
- [ ] Key pair downloaded and secured
- [ ] Security group allows port 4000
- [ ] SSH connection working
- [ ] Node.js 20 installed
- [ ] PM2 installed
- [ ] Backend code uploaded
- [ ] `.env` production file created on server
- [ ] App tested manually with `node index.js`
- [ ] App running with PM2
- [ ] PM2 startup configured (survives reboots)
- [ ] Frontend `.env.production` updated with EC2 URL
- [ ] (Optional) Domain + Nginx + SSL configured
