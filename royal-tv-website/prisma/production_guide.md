# 🚀 Royal TV Production PostgreSQL Deployment Guide

A step-by-step checklist for deploying your PostgreSQL database, Prisma schema, and auto-expiry (subscriptions/free trials) logic on Ubuntu 24.04.

---

## 1️⃣ Install & Initialize PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

---

## 2️⃣ Create Database & User

```bash
sudo -u postgres createuser --interactive  # e.g., royal_tv_user
sudo -u postgres createdb royal_tv_db -O royal_tv_user
```

**Set password:**

```bash
sudo -u postgres psql
ALTER USER royal_tv_user WITH PASSWORD 'yourpassword';
\q
```

---

## 3️⃣ Import Schema (Prisma or SQL Dump)

### Option A: Prisma (recommended if using Prisma migrations)

```bash
npx prisma migrate deploy
```

* Ensure `DATABASE_URL` is set for production database.

### Option B: SQL Dump

```bash
psql -U royal_tv_user -d royal_tv_db -f /path/to/exported_dump.sql
```

---

## 4️⃣ Set Up Auto-Expire/Auto-Disable (Subscription/FreeTrial)

### Option A: Server Cron Job (Recommended)

1. Save this SQL as `/opt/royaltv/expire_jobs.sql`:

```sql
UPDATE "Subscription" SET status = 'expired' WHERE status = 'active' AND endDate < NOW();
UPDATE "FreeTrial" SET status = 'disabled' WHERE status = 'active' AND endDate < NOW();
```

2. Edit crontab:

```bash
crontab -e
```

Add line (every hour):

```bash
0 * * * * psql -U royal_tv_user -d royal_tv_db -f /opt/royaltv/expire_jobs.sql
```

* For passwordless execution: set up `.pgpass` in home directory.

### Option B: pgAgent via pgAdmin (GUI Option)

* Install pgAgent (`sudo apt install pgagent`)
* In pgAdmin:

  * Create new job: `AutoExpireSubscriptionsAndTrials`
  * Step: Paste both UPDATE SQL statements
  * Schedule: Every hour

---

## 5️⃣ Verify Deployment

* Manually update endDate to past date for test records
* Wait for next job run
* Confirm `status` changes to `expired` (Subscription) and `disabled` (FreeTrial)
* Check with SQL query or pgAdmin

---

## 6️⃣ Security Notes

* Use strong, random passwords for DB users
* Limit permissions to minimum necessary
* Keep schema and job scripts under version control

---

## ✅ Deployment Checklist

* [ ] PostgreSQL installed
* [ ] Database/user created
* [ ] Schema imported
* [ ] Cron job or pgAgent job set up and tested
* [ ] `.pgpass` secured if needed
* [ ] Status auto-expiry tested and verified
* [ ] Documented for next production move

---
