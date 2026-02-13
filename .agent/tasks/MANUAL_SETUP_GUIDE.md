# Catalyst Transparency Platform - Manual Setup Guide

This document provides a comprehensive, step-by-step guide for manually setting up and deploying the Catalyst Transparency Platform.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Database Setup](#3-database-setup)
4. [External API Keys](#4-external-api-keys)
5. [Initial Data Ingestion](#5-initial-data-ingestion)
6. [Authentication Setup](#6-authentication-setup)
7. [AI/LLM Configuration](#7-aillm-configuration)
8. [Blockchain Integration](#8-blockchain-integration)
9. [Running the Application](#9-running-the-application)
10. [Production Deployment](#10-production-deployment)
11. [Post-Deployment Tasks](#11-post-deployment-tasks)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| Node.js | 18.x or higher | Runtime environment |
| npm/pnpm/yarn | Latest | Package management |
| PostgreSQL | 14.x or higher | Primary database |
| Git | 2.x | Version control |

### Optional Software

| Software | Purpose |
|----------|---------|
| Docker | Containerized deployment |
| Redis | Caching (future) |
| Nginx | Reverse proxy for production |

### System Requirements

- **RAM:** Minimum 4GB, recommended 8GB+
- **Storage:** Minimum 20GB for database and application
- **CPU:** 2+ cores recommended

---

## 2. Environment Setup

### 2.1 Clone the Repository

```bash
git clone <repository-url>
cd proof
```

### 2.2 Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2.3 Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

### 2.4 Configure Environment Variables

Edit `.env` with the following required variables:

```env
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://username:password@localhost:5432/catalyst_transparency?schema=public"

# ===========================================
# AUTHENTICATION
# ===========================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-min-32-chars"

# JWT Settings
JWT_SECRET="another-random-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# ===========================================
# EXTERNAL APIS
# ===========================================

# Blockfrost (Cardano blockchain data)
BLOCKFROST_API_KEY="your-blockfrost-api-key"
BLOCKFROST_NETWORK="mainnet"  # or "preprod" for testing

# CoinGecko (ADA price data)
COINGECKO_API_KEY="your-coingecko-api-key"  # Optional for basic tier

# ===========================================
# AI/LLM CONFIGURATION
# ===========================================

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4-turbo-preview"

# OR use local LLM
# LLM_PROVIDER="ollama"
# OLLAMA_BASE_URL="http://localhost:11434"
# OLLAMA_MODEL="llama2"

# ===========================================
# APPLICATION SETTINGS
# ===========================================
NODE_ENV="development"
PORT=3000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# ===========================================
# OPTIONAL SERVICES
# ===========================================

# Sentry (error tracking)
# SENTRY_DSN="your-sentry-dsn"

# Analytics
# ANALYTICS_ID="your-analytics-id"
```

### 2.5 Generate Secrets

Generate secure random secrets for `NEXTAUTH_SECRET` and `JWT_SECRET`:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 3. Database Setup

### 3.1 Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE catalyst_transparency;

# Create user (optional, for production)
CREATE USER catalyst_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE catalyst_transparency TO catalyst_user;

# Exit
\q
```

### 3.2 Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for development (creates migrations from schema changes)
npx prisma migrate dev
```

### 3.3 Verify Database Schema

```bash
# Open Prisma Studio to inspect database
npx prisma studio
```

This will open a browser window at `http://localhost:5555` where you can verify all tables were created.

### 3.4 Seed Initial Data (Optional)

If a seed file exists:

```bash
npx prisma db seed
```

---

## 4. External API Keys

### 4.1 Blockfrost API Key (Required for Blockchain Data)

1. Go to [https://blockfrost.io](https://blockfrost.io)
2. Create a free account
3. Create a new project for **Cardano Mainnet**
4. Copy the API key
5. Add to `.env` as `BLOCKFROST_API_KEY`

**Free tier limits:** 50,000 requests/day

### 4.2 CoinGecko API Key (Required for Price Data)

1. Go to [https://www.coingecko.com/en/api](https://www.coingecko.com/en/api)
2. Sign up for the **Demo API** (free tier available)
3. Generate an API key
4. Add to `.env` as `COINGECKO_API_KEY`

**Note:** Basic price lookups work without an API key but with rate limits.

### 4.3 OpenAI API Key (Required for AI Features)

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Create an account and add billing
3. Navigate to API Keys section
4. Create a new secret key
5. Add to `.env` as `OPENAI_API_KEY`

**Cost considerations:**
- GPT-4 Turbo: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- Set up usage limits in OpenAI dashboard to avoid unexpected costs

### 4.4 Alternative: Local LLM with Ollama

If you prefer not to use OpenAI:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2
# or
ollama pull mistral

# Start Ollama server
ollama serve
```

Then update `.env`:
```env
LLM_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"
```

---

## 5. Initial Data Ingestion

### 5.1 Ingest Catalyst Funds

The platform needs Catalyst fund data. Run the ingestion scripts:

```bash
# If there's a dedicated script
npm run ingest:funds

# Or manually via API/script
npx ts-node scripts/ingestFunds.ts
```

### 5.2 Ingest Proposals

Scrape and import proposals from Catalyst:

```bash
# Import all proposals (this may take a while)
npm run ingest:proposals

# Or import specific funds
npm run ingest:proposals -- --fund=12
npm run ingest:proposals -- --fund=13
```

**Expected duration:** 30-60 minutes for full historical data (Fund 2 to present)

### 5.3 Ingest People/Proposers

```bash
npm run ingest:people
```

### 5.4 Ingest Organizations

```bash
npm run ingest:organizations
```

### 5.5 Ingest Funding Transactions (Optional)

Requires Blockfrost API key:

```bash
npm run ingest:transactions
```

**Note:** This pulls on-chain transaction data for funded proposals.

### 5.6 Build Knowledge Graph (Optional)

For the knowledge graph visualization:

```bash
npm run build:knowledge-graph
```

### 5.7 Generate AI Embeddings (Optional)

For AI search features:

```bash
npm run generate:embeddings
```

**Warning:** This uses OpenAI API and will incur costs based on total text processed.

---

## 6. Authentication Setup

### 6.1 Wallet-Based Authentication

The platform uses Cardano wallet authentication. No additional setup needed - works with:
- Nami
- Eternl
- Flint
- Lace
- Yoroi
- Any CIP-30 compatible wallet

### 6.2 Admin User Setup

Create the first admin user:

```bash
# Via Prisma Studio
npx prisma studio
# Navigate to User table, create entry with role: "admin"

# Or via script
npx ts-node scripts/createAdmin.ts --wallet=addr1...
```

### 6.3 Configure OAuth Providers (Optional)

If you want social login:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## 7. AI/LLM Configuration

### 7.1 Verify OpenAI Connection

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 7.2 Configure Model Settings

In `.env`, set your preferred model:

```env
# Available models:
OPENAI_MODEL="gpt-4-turbo-preview"    # Best quality, higher cost
OPENAI_MODEL="gpt-4"                   # High quality
OPENAI_MODEL="gpt-3.5-turbo"          # Lower cost, good for most tasks
```

### 7.3 Set Token Limits

```env
# Maximum tokens per request
AI_MAX_TOKENS=4096

# Temperature (0-2, lower = more deterministic)
AI_TEMPERATURE=0.7
```

### 7.4 Enable/Disable AI Features

```env
# Toggle AI features
AI_SEARCH_ENABLED=true
AI_COMPARISON_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_EMBEDDINGS_ENABLED=true
```

---

## 8. Blockchain Integration

### 8.1 Configure Network

```env
# Mainnet (production)
BLOCKFROST_NETWORK="mainnet"
CARDANO_NETWORK="mainnet"

# Preprod (testing)
BLOCKFROST_NETWORK="preprod"
CARDANO_NETWORK="preprod"
```

### 8.2 Known Treasury Addresses

The platform tracks Catalyst treasury addresses. These are pre-configured but can be updated:

```typescript
// src/lib/blockfrost.ts
const CATALYST_TREASURY_ADDRESSES = [
  "addr1...", // Fund treasury
  "addr1...", // Distribution wallet
];
```

### 8.3 Transaction Sync Schedule

For production, set up a cron job to sync transactions:

```bash
# Add to crontab
# Sync every 6 hours
0 */6 * * * cd /path/to/proof && npm run sync:transactions
```

---

## 9. Running the Application

### 9.1 Development Mode

```bash
npm run dev
```

Access at: `http://localhost:3000`

### 9.2 Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### 9.3 Verify Application

1. Open `http://localhost:3000`
2. Check the following pages load:
   - `/` - Homepage
   - `/projects` - Projects list
   - `/funds` - Funds list
   - `/discover` - Discovery/swipe UI
   - `/api/docs` - API documentation

### 9.4 Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-13T..."
}
```

---

## 10. Production Deployment

### 10.1 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add all required env vars
```

### 10.2 Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/catalyst
      - NEXTAUTH_URL=https://your-domain.com
    depends_on:
      - db

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=catalyst
      - POSTGRES_PASSWORD=password

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

### 10.3 Manual Server Deployment

```bash
# On server
git pull origin main
npm install
npm run build
pm2 restart catalyst-transparency
```

### 10.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10.5 SSL Certificate

```bash
# Using Certbot
sudo certbot --nginx -d your-domain.com
```

---

## 11. Post-Deployment Tasks

### 11.1 Set Up Monitoring

- Configure uptime monitoring (UptimeRobot, Pingdom)
- Set up error tracking (Sentry)
- Configure log aggregation (Papertrail, Logtail)

### 11.2 Schedule Regular Tasks

Add to crontab:

```bash
# Daily proposal sync (2 AM)
0 2 * * * cd /path/to/proof && npm run sync:proposals

# Transaction sync (every 6 hours)
0 */6 * * * cd /path/to/proof && npm run sync:transactions

# Price cache update (every hour)
0 * * * * cd /path/to/proof && npm run update:prices

# Database backup (daily at 3 AM)
0 3 * * * pg_dump catalyst_transparency > /backups/catalyst_$(date +\%Y\%m\%d).sql
```

### 11.3 Configure Backups

```bash
# Create backup directory
mkdir -p /backups

# Test backup
pg_dump catalyst_transparency > /backups/test_backup.sql

# Restore test
# psql catalyst_transparency < /backups/test_backup.sql
```

### 11.4 Review Security

- [ ] All API keys are in environment variables (not in code)
- [ ] Database is not publicly accessible
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Admin routes are protected

### 11.5 Performance Optimization

```bash
# Analyze database queries
npx prisma studio  # Check for slow queries

# Add database indexes if needed
npx prisma migrate dev --name add_indexes
```

---

## 12. Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: P1001: Can't reach database server
```

**Solution:**
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL format
3. Verify database exists: `psql -l`

#### Prisma Client Not Generated

```
Error: @prisma/client did not initialize
```

**Solution:**
```bash
npx prisma generate
```

#### Blockfrost API Errors

```
Error: 403 Forbidden
```

**Solution:**
1. Verify API key is correct
2. Check you're using the right network (mainnet vs preprod)
3. Check rate limits haven't been exceeded

#### OpenAI API Errors

```
Error: 401 Unauthorized
```

**Solution:**
1. Verify API key is correct
2. Check billing is set up on OpenAI account
3. Verify model name is correct

#### Build Failures

```
Error: Type errors during build
```

**Solution:**
```bash
# Check for type errors
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run build
```

#### Port Already in Use

```
Error: EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Getting Help

- Check logs: `npm run logs` or `pm2 logs`
- Database issues: `npx prisma studio`
- API issues: Check `/api/docs` for endpoint documentation

---

## Quick Start Checklist

```
[ ] 1. Clone repository
[ ] 2. Install dependencies (npm install)
[ ] 3. Create .env file with required variables
[ ] 4. Set up PostgreSQL database
[ ] 5. Run Prisma migrations
[ ] 6. Get Blockfrost API key
[ ] 7. Get OpenAI API key (or set up Ollama)
[ ] 8. Run initial data ingestion
[ ] 9. Start development server
[ ] 10. Verify all pages load correctly
[ ] 11. Create admin user
[ ] 12. Deploy to production
[ ] 13. Set up SSL
[ ] 14. Configure cron jobs
[ ] 15. Set up monitoring
```

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ | Application URL |
| `NEXTAUTH_SECRET` | ✅ | Auth encryption key |
| `JWT_SECRET` | ✅ | JWT signing key |
| `BLOCKFROST_API_KEY` | ✅ | Cardano blockchain data |
| `OPENAI_API_KEY` | ⚠️ | Required for AI features |
| `COINGECKO_API_KEY` | ❌ | Optional, for higher rate limits |
| `NODE_ENV` | ❌ | development/production |

---

*Last updated: 2026-02-13*
