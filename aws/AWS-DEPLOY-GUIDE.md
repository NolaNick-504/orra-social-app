# ORRA on AWS - Easy Deployment Guide

## You already have an AWS account (AURA) with $100 free credits. That's great!

---

## What You'll Need (Only 3 Things)

1. **Your AWS account** (you already have this!)
2. **About 30 minutes** of your time
3. **Just copy and paste** — no tech skills needed!

---

## Step 1: Create Your EC2 Server (5 minutes)

1. Go to [AWS Console](https://us-east-2.console.aws.amazon.com) (you're already logged in)

2. Click the **search bar** at the top and type **EC2**, then click **EC2**

3. Click the orange **"Launch Instance"** button

4. Fill in these settings:
   - **Name**: Type `ORRA-Server`
   - **Application and OS Images**: Click **Ubuntu** (it's usually the default)
     - Make sure it says **Ubuntu 24.04 LTS** or **Ubuntu 22.04 LTS** — it MUST be Ubuntu, the Free Tier eligible one
   - **Instance type**: Should say **t2.micro** (Free Tier eligible) — don't change this
   - **Key pair (login)**: 
     - Click **"Create new key pair"**
     - Name it: `orra-key`
     - Click **"Create key pair"**
     - A file will download to your phone/computer — SAVE THIS! You'll need it later
   - **Network settings**: 
     - Check ✅ **"Allow SSH traffic from Anywhere"**
     - Check ✅ **"Allow HTTP traffic from the internet"**
     - Check ✅ **"Allow HTTPS traffic from the internet"**
   - **Configure storage**: Change 8 GB to **30 GB** (Free Tier allows up to 30 GB)
   - Leave everything else as default

5. Click the orange **"Launch instance"** button on the right side

6. Wait about 1 minute, then click **"View all instances"**

---

## Step 2: Connect to Your Server (2 minutes)

1. In the EC2 page, find your **ORRA-Server** instance

2. Wait until the **"Instance state"** column says **"Running"** (refresh if needed)

3. Click the checkbox next to your instance

4. Click the **"Connect"** button at the top

5. Click **"EC2 Instance Connect"** tab at the top

6. Click the orange **"Connect"** button

7. A **black terminal window** will open — this is your server!

---

## Step 3: Install ORRA (10 minutes - JUST COPY & PASTE!)

Now just copy and paste this ONE command into the black terminal and press Enter:

```bash
sudo apt-get update -y && sudo apt-get install -y git curl && git clone https://github.com/NolaNick-504/orra_social_app.git /home/ubuntu/orra && bash /home/ubuntu/orra/aws/setup-ec2.sh
```

That's it! Just wait. The script will:
- ✅ Install everything automatically
- ✅ Download your ORRA app from GitHub
- ✅ Build and start the server
- ✅ Set up auto-restart (if the server reboots, ORRA comes back online)
- ✅ Configure the web server

It takes about 10-15 minutes. You'll see a lot of text scrolling — that's normal.

When it's done, you'll see a big green message that says **"ORRA IS LIVE! 🎉"** with your app URL.

---

## Step 4: Open Your App!

1. Go back to the AWS EC2 page

2. Find your **ORRA-Server** instance

3. Look at the **"Public IPv4 address"** column — that's your server's address (like `3.15.42.88`)

4. Open your phone browser or Chrome

5. Type `http://` followed by that IP address (example: `http://3.15.42.88`)

6. **Your ORRA app is live! 🎉**

7. Log in with:
   - Email: `nickjoseph8087@gmail.com`
   - Password: `Weareone504`

---

## How to Update ORRA (When New Code is Ready)

If you or your developer makes changes to the code on GitHub, just:

1. Connect to your EC2 instance (same way as Step 2)
2. Copy and paste this:

```bash
bash /home/ubuntu/orra/aws/update-orra.sh
```

3. Wait 3-5 minutes — done!

---

## Common Questions

### Will this cost me money?
**No!** The t2.micro instance is FREE for 12 months (Free Tier). You have $100 in credits too. This should cost you $0.

### What if the server restarts?
**ORRA comes back automatically!** PM2 (the process manager) auto-restarts everything.

### What if something breaks?
Connect to your EC2 instance and run:
```bash
pm2 logs orra-server
```
This shows you what's happening. Copy any error messages and send them to your developer.

### How do I check if ORRA is running?
```bash
pm2 status
```
If it says "online" next to orra-server, everything is good!

### How do I restart ORRA?
```bash
pm2 restart orra-server
```

### Can I get a real domain name (like orra.app)?
Yes! Once you buy a domain, you can set it up. Ask your developer to help with that step — it involves pointing the domain to your EC2 IP and setting up HTTPS.

### What about my profile pictures and data?
Everything is stored on the EC2 server's disk. It persists across restarts. BUT — if you ever terminate the EC2 instance, all data is lost. So keep regular backups.

### How do I back up the database?
```bash
cp /home/ubuntu/orra/db/production.db /home/ubuntu/orra/db/backup-$(date +%Y%m%d).db
```

---

## Quick Reference Card

| What you want | Command |
|---|---|
| View app status | `pm2 status` |
| View live logs | `pm2 logs orra-server` |
| Restart app | `pm2 restart orra-server` |
| Stop app | `pm2 stop orra-server` |
| Update app | `bash /home/ubuntu/orra/aws/update-orra.sh` |
| Back up database | `cp /home/ubuntu/orra/db/production.db /home/ubuntu/orra/db/backup.db` |
| Check server disk space | `df -h` |

---

## Need to Set Up a Custom Domain Later?

1. Buy a domain (like from Namecheap, GoDaddy, etc.)
2. In your domain's DNS settings, add an **A Record** pointing to your EC2 Public IP
3. Connect to EC2 and run:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
4. Your app will now be available at `https://yourdomain.com` with HTTPS! 🔒
