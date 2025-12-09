# Docker Setup Guide

This project includes Docker Compose configurations for easy development and deployment.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Quick Start

### Option 1: Database Only (Recommended for Development)

Run PostgreSQL and pgAdmin only, while running the NestJS app locally:

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# The database will be available at:
# - PostgreSQL: localhost:5432
# - pgAdmin: http://localhost:5050
#   - Email: admin@wallet.local
#   - Password: admin

# Run the app locally
npm install
npm run start:dev
```

### Option 2: Full Stack (Application + Database)

Run everything in Docker with hot reload:

```bash
# Create .env file with your credentials
cp .env.example .env

# Edit .env and add your Google OAuth and Paystack credentials
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# PAYSTACK_SECRET_KEY=sk_test_your-key
# PAYSTACK_PUBLIC_KEY=pk_test_your-key

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# The application will be available at:
# - API: http://localhost:3000
# - pgAdmin: http://localhost:5050
```

## Docker Compose Files

### `docker-compose.yml`
- PostgreSQL database
- pgAdmin web interface
- **Use this when**: You want to run the app locally but need a database

### `docker-compose.dev.yml`
- PostgreSQL database
- NestJS application (with hot reload)
- pgAdmin web interface
- **Use this when**: You want everything in Docker

## Useful Commands

### Managing Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres

# Restart a service
docker-compose restart app
```

### Database Management

```bash
# Access PostgreSQL CLI
docker exec -it wallet_service_db psql -U postgres -d wallet_service

# Run SQL commands
docker exec -it wallet_service_db psql -U postgres -d wallet_service -c "SELECT * FROM users;"

# Create database backup
docker exec wallet_service_db pg_dump -U postgres wallet_service > backup.sql

# Restore database from backup
docker exec -i wallet_service_db psql -U postgres wallet_service < backup.sql
```

### Application Management (when using dev compose)

```bash
# Rebuild application container
docker-compose -f docker-compose.dev.yml build app

# Access application shell
docker exec -it wallet_service_app sh

# Run migrations (if you add them later)
docker exec -it wallet_service_app npm run migration:run

# Run tests
docker exec -it wallet_service_app npm test
```

## pgAdmin Configuration

When first accessing pgAdmin at http://localhost:5050:

1. Login with:
   - Email: `admin@wallet.local`
   - Password: `admin`

2. Add PostgreSQL server:
   - Right-click "Servers" → "Register" → "Server"
   - **General tab**:
     - Name: `Wallet Service`
   - **Connection tab**:
     - Host: `postgres` (or `host.docker.internal` if running pgAdmin locally)
     - Port: `5432`
     - Database: `wallet_service`
     - Username: `postgres`
     - Password: `postgres`

## Environment Variables

When using `docker-compose.dev.yml`, you need these environment variables:

```env
# Required
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PAYSTACK_SECRET_KEY=sk_test_your-key
PAYSTACK_PUBLIC_KEY=pk_test_your-key

# Optional (defaults provided)
NODE_ENV=development
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wallet_service
```

## Troubleshooting

### Port Already in Use

If you see "port is already allocated":

```bash
# Find process using port 5432 (PostgreSQL)
lsof -i :5432

# Or port 3000 (NestJS)
lsof -i :3000

# Kill the process or use different ports
```

### Database Connection Issues

```bash
# Check if PostgreSQL is ready
docker exec wallet_service_db pg_isready -U postgres

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Hot Reload Not Working

```bash
# Rebuild the container
docker-compose -f docker-compose.dev.yml build app
docker-compose -f docker-compose.dev.yml up -d app
```

### Clean Slate

Remove everything and start fresh:

```bash
# Stop all containers
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Remove volumes (deletes all data)
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi wallet_service_app

# Start fresh
docker-compose up -d
```

## Production Deployment

For production, use the standard `Dockerfile`:

```bash
# Build production image
docker build -t wallet-service:latest .

# Run with production environment
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name wallet-service \
  wallet-service:latest
```

Or create a `docker-compose.prod.yml` for production orchestration.

## Network Configuration

All services run on the `wallet_network` bridge network, allowing them to communicate using service names:

- From app to database: `postgres:5432`
- From app to pgAdmin: `pgadmin:80`

## Data Persistence

Database data is persisted in Docker volumes:
- `postgres_data`: PostgreSQL database files
- `pgadmin_data`: pgAdmin configuration and settings

These volumes persist even when containers are stopped.
