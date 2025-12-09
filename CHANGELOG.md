# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Docker Support (2025-12-09)

- **Docker Compose** for PostgreSQL database
  - `docker-compose.yml` - Database only setup
  - `docker-compose.dev.yml` - Full stack with hot reload
  - PostgreSQL 15 Alpine image
  - pgAdmin 4 web interface
  - Data persistence with Docker volumes

- **Dockerfiles**
  - `Dockerfile` - Production build (multi-stage)
  - `Dockerfile.dev` - Development with hot reload
  - `.dockerignore` - Optimized build context

- **Documentation**
  - `README.Docker.md` - Comprehensive Docker guide
  - Updated `README.md` with Docker quick start
  - `verify-setup.sh` - Setup verification script

- **NPM Scripts**
  - `npm run docker:db` - Start database
  - `npm run docker:db:stop` - Stop database
  - `npm run docker:dev` - Start full stack
  - `npm run docker:dev:stop` - Stop full stack
  - `npm run docker:dev:logs` - View app logs
  - `npm run docker:clean` - Clean all containers and volumes

### Phase 3 Complete - Wallet Core (2025-12-09)

- **Wallet Entity**
  - Unique 13-digit wallet numbers
  - Auto-creation on user signup
  - Balance tracking with currency support

- **Transaction Entity**
  - Transaction types: deposit, transfer_in, transfer_out
  - Status tracking: pending, success, failed
  - Reference field for Paystack integration
  - Metadata JSONB field for additional data
  - Balance snapshots (before/after)

- **Wallet Endpoints**
  - `GET /wallet/balance` - View wallet balance
  - `GET /wallet/transactions` - Transaction history with pagination

- **Services**
  - WalletService with wallet number generation
  - Transaction history with pagination support

### Phase 2 Complete - Authentication (2025-12-09)

- **Google OAuth 2.0** integration
  - Google OAuth strategy with Passport
  - JWT generation and validation
  - User creation/update on OAuth callback

- **Authentication Endpoints**
  - `GET /auth/google` - Initiate OAuth flow
  - `GET /auth/google/callback` - Handle OAuth callback

- **Guards & Decorators**
  - JwtAuthGuard for JWT validation
  - CombinedAuthGuard (JWT + API key support prepared)
  - @CurrentUser decorator for request context

- **User Management**
  - User entity with Google OAuth fields
  - UsersService with CRUD operations
  - Auto-wallet creation on signup

### Phase 1 Complete - Foundation (2025-12-09)

- **NestJS Project Setup**
  - TypeScript configuration
  - ESLint + Prettier
  - Jest testing setup

- **Database Configuration**
  - PostgreSQL with TypeORM
  - Auto-synchronization in development
  - Environment-based configuration

- **Security & Validation**
  - Helmet.js for HTTP headers
  - Rate limiting (100 req/min)
  - Global validation pipe
  - Global exception filter
  - CORS configuration

- **Configuration Management**
  - ConfigModule with Joi validation
  - Environment variable validation
  - Type-safe configuration

- **Project Structure**
  - Feature-based module organization
  - Common shared code (guards, decorators, filters)
  - Separation of concerns

## [0.0.1] - 2025-12-09

### Initial Release

- Project initialization with NestJS CLI
- Basic project structure
- Environment configuration
- TypeScript setup
