# Wallet Service API

A production-ready NestJS wallet service with Google OAuth authentication, Paystack payment integration, and API key management.

## Features

- **Google OAuth 2.0** authentication with JWT
- **Paystack** deposit integration with webhook handling
- **Wallet-to-wallet** transfers (atomic transactions)
- **API Key System** for service-to-service access
- **Permission-based** access control
- **Transaction history** with pagination
- **PostgreSQL** with TypeORM
- **Docker** support for easy development

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport (Google OAuth, JWT)
- **Payment**: Paystack
- **Validation**: class-validator
- **Security**: Helmet, bcrypt, rate limiting

## Quick Start

### Option 1: Docker (Recommended)

Start PostgreSQL and pgAdmin:

```bash
# Start database
npm run docker:db

# Install dependencies
npm install

# Run the application
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Option 2: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb wallet_service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Then start the app
npm run start:dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database (use 'postgres' as host when running in Docker, 'localhost' otherwise)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wallet_service

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# Google OAuth (get from: https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Paystack (get from: https://dashboard.paystack.com/)
PAYSTACK_SECRET_KEY=sk_test_your-key
PAYSTACK_PUBLIC_KEY=pk_test_your-key
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/google` | Initiate Google OAuth | None |
| GET | `/auth/google/callback` | OAuth callback, returns JWT | None |

### Wallet Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/wallet/deposit` | Initialize Paystack deposit | JWT/API Key |
| GET | `/wallet/balance` | Get wallet balance | JWT/API Key |
| POST | `/wallet/transfer` | Transfer to another wallet | JWT/API Key |
| GET | `/wallet/transactions` | Get transaction history | JWT/API Key |
| GET | `/wallet/deposit/:reference/status` | Check deposit status | JWT/API Key |

### Paystack Webhook

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/wallet/paystack/webhook` | Handle Paystack events | Signature |

### API Keys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/keys/create` | Create API key | JWT |
| POST | `/keys/rollover` | Rollover expired key | JWT |

## Authentication Methods

### JWT (User Authentication)

```bash
# Get JWT from Google OAuth
curl http://localhost:3000/auth/google

# Use JWT in requests
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:3000/wallet/balance
```

### API Key (Service-to-Service)

```bash
# Create API key
curl -X POST http://localhost:3000/keys/create \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "wallet-service",
    "permissions": ["deposit", "transfer", "read"],
    "expiry": "1M"
  }'

# Use API key in requests
curl -H "x-api-key: sk_live_xxxxx" \
  http://localhost:3000/wallet/balance
```

## Docker Commands

```bash
# Start database only
npm run docker:db

# Stop database
npm run docker:db:stop

# Start full stack (app + database)
npm run docker:dev

# View application logs
npm run docker:dev:logs

# Stop full stack
npm run docker:dev:stop

# Clean everything (removes data)
npm run docker:clean
```

For detailed Docker documentation, see [README.Docker.md](README.Docker.md)

## Database Access

### pgAdmin (Web Interface)

When running Docker:
- URL: http://localhost:5050
- Email: `admin@wallet.local`
- Password: `admin`

### PostgreSQL CLI

```bash
# Using Docker
docker exec -it wallet_service_db psql -U postgres -d wallet_service

# Local PostgreSQL
psql -U postgres -d wallet_service
```

## Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run linter
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Project Structure

```
src/
├── config/              # Configuration module
│   ├── configuration.ts
│   └── validation.schema.ts
├── common/              # Shared code
│   ├── decorators/      # @CurrentUser, etc.
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   └── pipes/           # Validation pipes
├── modules/
│   ├── auth/            # Google OAuth + JWT
│   ├── users/           # User management
│   ├── wallet/          # Wallet operations
│   ├── paystack/        # Payment integration
│   └── api-keys/        # API key management
└── main.ts              # Application entry point
```

## Key Features Implementation

### Atomic Transfers
Transfers use PostgreSQL row-level locking to ensure atomicity:
- Lock sender wallet
- Check balance
- Lock receiver wallet
- Deduct from sender
- Credit receiver
- Record both transactions

### Webhook Idempotency
Paystack webhooks are idempotent to prevent double-crediting:
- Check idempotency key by reference
- Process webhook only once
- Store response for duplicate requests

### API Key Security
API keys are securely hashed:
- Generated with 64 random hex characters
- Hashed with bcrypt before storage
- Only shown once during creation
- Max 5 active keys per user

### Wallet Number Generation
13-digit wallet numbers starting with '4':
- Randomly generated
- Uniqueness verified with retry logic
- Stored with wallet entity

## Security Features

- Helmet.js for HTTP security headers
- Rate limiting (100 req/min)
- CORS configuration
- Input validation on all endpoints
- SQL injection protection (TypeORM)
- API key hashing (bcrypt)
- Webhook signature validation (HMAC)
- Environment variable validation (Joi)

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is running
docker ps | grep wallet_service_db

# Check database logs
docker logs wallet_service_db

# Restart database
npm run docker:db:stop && npm run docker:db
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Hot Reload Not Working

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run start:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

UNLICENSED

## Support

For issues and questions, please open an issue on GitHub.
