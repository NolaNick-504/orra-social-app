# ORRA Social App — AWS Deployment Guide

Complete step-by-step guide to deploy the ORRA social app on AWS EC2. No prior AWS experience required.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create an EC2 Instance](#step-1-create-an-ec2-instance)
3. [Step 2: SSH Into the Instance](#step-2-ssh-into-the-instance)
4. [Step 3: Run the Setup Script](#step-3-run-the-setup-script)
5. [Step 4: Configure DNS](#step-4-configure-dns)
6. [Step 5: Set Up SSL with Certbot](#step-5-set-up-ssl-with-certbot)
7. [Step 6: Verify the Deployment](#step-6-verify-the-deployment)
8. [Step 7: Set Up Automatic Deployments](#step-7-set-up-automatic-deployments)
9. [Cost Breakdown](#cost-breakdown)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, make sure you have:

| Item | Details |
|------|---------|
| **AWS Account** | Free tier eligible — [Sign up here](https://aws.amazon.com/) |
| **Domain Name** | `orra.app` — must be registered and accessible in your DNS provider |
| **SSH Key Pair** | Created in AWS to connect to your EC2 instance |
| **Terminal** | macOS Terminal, Windows PowerShell/WSL, or Linux terminal |

> **What is AWS EC2?** Think of it as renting a virtual computer in the cloud. You get full control over it — just like your own server.

---

## Step 1: Create an EC2 Instance

This is the virtual server that will host your app.

### 1.1 Log in to AWS Console

1. Go to [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
2. Sign in with your AWS account

### 1.2 Navigate to EC2

1. In the search bar at the top, type **"EC2"**
2. Click on **EC2** under the Services results

### 1.3 Launch a New Instance

1. Click the **"Launch Instance"** button (orange, top-right)

2. **Name and tags:**
   - Name: `orra-app-server`

3. **Application and OS Images:**
   - Choose **Ubuntu**
   - Select **Ubuntu 24.04 LTS** (Free tier eligible)
   - Architecture: **64-bit (x86)**

4. **Instance type:**
   - Select **t2.micro** (Free tier eligible — 1 vCPU, 1GB RAM)
   - > ⚠️ For production with real users, consider **t3.small** (2GB RAM) for ~$15/mo

5. **Key pair (login):**
   - Click **"Create new key pair"**
   - Name: `orra-ssh-key`
   - Type: **RSA**
   - Format: **.pem** (for Mac/Linux) or **.ppk** (for PuTTY on Windows)
   - Click **"Create key pair"** — the file will download automatically
   - > 🔒 **Save this file securely!** You cannot download it again. You'll need it to connect to your server.

6. **Network settings:**
   - Check **"Allow SSH traffic from anywhere"** (port 22)
   - Check **"Allow HTTP traffic from the internet"** (port 80)
   - Check **"Allow HTTPS traffic from the internet"** (port 443)

7. **Configure storage:**
   - Size: **20 GB** (default is fine)
   - Type: **gp3** (default)

8. **Advanced details** (optional but recommended):
   - Scroll down to **"User data"** at the very bottom
   - You can paste the entire `setup-ec2.sh` script here to auto-configure on first boot
   - Or skip this and run it manually in Step 3

9. Click **"Launch instance"** 🚀

### 1.4 Allocate an Elastic IP (Static IP)

By default, your EC2 instance gets a new IP every time it restarts. Let's fix that:

1. In the EC2 sidebar, click **"Elastic IPs"** under Network & Security
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"** — you'll get a static IP
4. Select the new IP → Click **"Associate Elastic IP address"**
5. Select your `orra-app-server` instance → Click **"Associate"**
6. **Write down this IP** — you'll need it for DNS and SSH

> 💡 Elastic IPs are free as long as they're associated with a running instance.

---

## Step 2: SSH Into the Instance

Now let's connect to your new server.

### 2.1 Set permissions on your SSH key

On your local machine, run:

```bash
# Navigate to where you downloaded the key (usually Downloads/)
cd ~/Downloads

# Set correct permissions (SSH will reject the key without this)
chmod 400 orra-ssh-key.pem
```

### 2.2 Connect via SSH

```bash
# Replace YOUR_ELASTIC_IP with the Elastic IP from Step 1.4
ssh -i orra-ssh-key.pem ubuntu@YOUR_ELASTIC_IP
```

**First time?** You'll see a message like:
```
The authenticity of host '12.34.56.78' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Type **`yes`** and press Enter.

You should now see a terminal prompt like:
```
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

🎉 **You're connected to your server!**

---

## Step 3: Run the Setup Script

The setup script automates the entire installation: Node.js, Nginx, PM2, the app, and everything else.

### 3.1 Create and run the setup script

```bash
# Create the setup script
nano setup-ec2.sh
```

Paste the contents of `aws/setup-ec2.sh` from the repo, then:

```bash
# Make it executable
chmod +x setup-ec2.sh

# Run it as root
sudo ./setup-ec2.sh
```

The script will take **5-10 minutes** to run. You'll see progress messages like:
```
[INFO]  Step 1/12: Updating system packages...
[OK]    System packages updated.
[INFO]  Step 2/12: Installing Node.js 20.x...
...
```

### 3.2 If the script fails

If something goes wrong, you can re-run it safely — it's idempotent (safe to run multiple times).

---

## Step 4: Configure DNS

Now point your domain to your EC2 server.

### 4.1 Go to your domain registrar

Wherever you purchased `orra.app` (e.g., GoDaddy, Namecheap, Google Domains, Route 53).

### 4.2 Add DNS records

Add the following **A records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_ELASTIC_IP` | 300 |
| A | `www` | `YOUR_ELASTIC_IP` | 300 |

### 4.3 Wait for DNS propagation

DNS changes can take **5 minutes to 48 hours** to take effect. Usually it's within 15 minutes.

Check propagation at: [https://dnschecker.org/](https://dnschecker.org/)

### 4.4 Verify DNS is working

On your local machine:
```bash
ping orra.app
```
You should see your Elastic IP in the response.

> 💡 **Using AWS Route 53?** (Recommended for long-term):
> 1. Go to Route 53 → Create Hosted Zone → `orra.app`
> 2. Add A records pointing to your Elastic IP
> 3. Update nameservers at your domain registrar to the Route 53 nameservers

---

## Step 5: Set Up SSL with Certbot

SSL makes your site use HTTPS (the 🔒 icon in browsers). It's required for NextAuth to work properly.

### 5.1 Make sure DNS is propagated first

```bash
# On your EC2 instance, test if DNS resolves
dig orra.app +short
```
This should return your Elastic IP. If not, wait for DNS propagation.

### 5.2 Run Certbot

```bash
sudo certbot --nginx -d orra.app -d www.orra.app
```

Certbot will ask:
1. **Email** — Enter your email for renewal notifications
2. **Terms of Service** — Type `Y` to agree
3. **Share email** — Type `N` (optional)
4. **Redirect HTTP to HTTPS** — Type `2` (Redirect)

### 5.3 Verify auto-renewal

Certbot installs a cron job that auto-renews your certificate. Verify it:

```bash
sudo certbot renew --dry-run
```

If you see "Congratulations, all simulated renewals succeeded", you're good.

> 🔒 Your SSL certificate auto-renews every 60 days (certificates are valid for 90 days).

---

## Step 6: Verify the Deployment

### 6.1 Check the app in your browser

Open these URLs:

| URL | Expected Result |
|-----|-----------------|
| `https://orra.app` | ORRA app homepage loads |
| `https://orra.app/api/auth/signin` | Sign-in page |
| `http://orra.app` | Redirects to `https://orra.app` |

### 6.2 Check server health

On your EC2 instance:

```bash
# Check PM2 status
pm2 status

# Check app logs
pm2 logs orra --lines 20

# Check Nginx status
sudo systemctl status nginx

# Test the app locally
curl -I http://localhost:3000
```

Expected PM2 output:
```
┌────┬──────────┬─────────────┬─────────┬──────────┐
│ id │ name     │ mode        │ status  │ restarts │
├────┼──────────┼─────────────┼─────────┼──────────┤
│ 0  │ orra     │ fork        │ online  │ 0        │
└────┴──────────┴─────────────┴─────────┴──────────┘
```

### 6.3 Log in with the founder account

- **Email:** nickjoseph8087@gmail.com
- **Password:** Weareone504

---

## Step 7: Set Up Automatic Deployments

When you push code to GitHub, you'll want to update the server easily.

### 7.1 Using the deploy script

SSH into your EC2 instance and run:

```bash
cd /home/ubuntu/orra-social-app
bash aws/deploy.sh
```

This will:
1. Pull the latest code from GitHub
2. Install dependencies
3. Build the app
4. Restart PM2
5. Show status

### 7.2 (Optional) Set up a GitHub webhook for auto-deploy

For fully automatic deployments on every push, you can use a GitHub webhook with PM2:

```bash
# Install PM2 webhook module
pm2 install pm2-server-monit

# Or create a simple webhook endpoint in your app
```

For now, the manual `deploy.sh` approach is simplest and most reliable.

---

## Cost Breakdown

### Free Tier (First 12 months)

| Item | Cost | Notes |
|------|------|-------|
| EC2 t2.micro | **$0.00/mo** | 750 hours/mo free tier |
| EBS Storage (20GB) | **$0.00/mo** | Up to 30GB free |
| Elastic IP | **$0.00/mo** | Free when attached to running instance |
| Data Transfer | **$0.00/mo** | First 100GB/mo free |
| Route 53 (optional) | **$0.50/mo** | Per hosted zone |
| **Total** | **~$0.50/mo** | With Route 53, or $0 without |

### After Free Tier (Month 13+)

| Item | Cost | Notes |
|------|------|-------|
| EC2 t2.micro | **$8.35/mo** | On-demand pricing |
| EBS Storage (20GB) | **$1.60/mo** | gp3 at $0.08/GB |
| Elastic IP | **$0.00/mo** | Free when attached |
| Data Transfer | **~$0.50/mo** | Estimated for small traffic |
| Route 53 (optional) | **$0.50/mo** | Per hosted zone |
| **Total** | **~$10-15/mo** | For t2.micro |

### Production Recommendation (Real Users)

| Item | Cost | Notes |
|------|------|-------|
| EC2 t3.small | **$15.02/mo** | 2GB RAM — better for Next.js |
| EBS Storage (20GB) | **$1.60/mo** | gp3 |
| CloudFront (CDN) | **~$1-5/mo** | For faster static asset delivery |
| Route 53 | **$0.50/mo** | DNS management |
| **Total** | **~$18-22/mo** | Recommended for production |

---

## Troubleshooting

### App won't start / PM2 shows "errored"

```bash
# Check the error logs
pm2 logs orra --err --lines 50

# Common fix: missing .env file
cp .env.production .env

# Common fix: database not initialized
npx prisma migrate deploy
npx prisma db seed

# Restart PM2
pm2 restart orra
```

### "502 Bad Gateway" in browser

This means Nginx can't reach the Next.js app.

```bash
# Is the app running?
pm2 status

# If not running, start it
pm2 start ecosystem.config.js --env production

# Check if app responds locally
curl http://localhost:3000

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log
```

### Can't connect via SSH

```bash
# Check your key permissions (on your local machine)
chmod 400 orra-ssh-key.pem

# Check security group allows port 22
# In AWS Console → EC2 → Security Groups → Your group → Inbound Rules
# Should have: SSH (22) from 0.0.0.0/0
```

### SSL certificate errors

```bash
# Check certificate status
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal

# Re-install certificate for Nginx
sudo certbot --nginx -d orra.app -d www.orra.app
```

### Database errors

```bash
# Check if database file exists
ls -la /home/ubuntu/orra-social-app/db/

# If missing, recreate it
cd /home/ubuntu/orra-social-app
npx prisma migrate deploy
npx prisma db seed

# Check database integrity
sqlite3 db/production.db "PRAGMA integrity_check;"
```

### App is slow / running out of memory

```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 monit

# If using t2.micro (1GB RAM), you may need to:
# 1. Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Or upgrade to t3.small (2GB RAM) in the AWS Console
```

### Nginx configuration issues

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx access logs
sudo tail -50 /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log
```

### Port 3000 is already in use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID)
sudo kill -9 PID

# Restart with PM2
pm2 restart orra
```

### Git pull conflicts during deployment

```bash
# Reset to the remote version (discards local changes)
cd /home/ubuntu/orra-social-app
git fetch origin
git reset --hard origin/main

# Then redeploy
bash aws/deploy.sh
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| SSH into server | `ssh -i orra-ssh-key.pem ubuntu@YOUR_IP` |
| Check app status | `pm2 status` |
| View app logs | `pm2 logs orra` |
| Restart app | `pm2 restart orra` |
| Stop app | `pm2 stop orra` |
| Deploy latest code | `bash aws/deploy.sh` |
| Test Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew SSL | `sudo certbot renew` |
| Check disk space | `df -h` |
| Check memory | `free -h` |
| Server reboot | `sudo reboot` |

---

## Architecture Overview

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   orra.app DNS  │
              │   (A Record)    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  AWS EC2 Instance│
              │  (Ubuntu 24.04)  │
              │                  │
              │  ┌─────────────┐│
              │  │   Nginx     ││  ← Port 80/443 (SSL)
              │  │ :80 / :443  ││
              │  └──────┬──────┘│
              │         │       │
              │         ▼       │
              │  ┌─────────────┐│
              │  │   PM2       ││
              │  │  Next.js    ││  ← Port 3000
              │  │ :3000       ││
              │  └──────┬──────┘│
              │         │       │
              │         ▼       │
              │  ┌─────────────┐│
              │  │  SQLite DB  ││  ← ~/orra-social-app/db/
              │  │ production.db││
              │  └─────────────┘│
              └─────────────────┘
```

---

*Last updated: 2025*
*Questions? Check the troubleshooting section above or review the AWS EC2 documentation.*
