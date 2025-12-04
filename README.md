# NFT Metadata API

A production-ready Multi-Chain NFT Metadata API that fetches and caches NFT metadata across Ethereum, Polygon, and Starknet, with IPFS integration for decentralized metadata storage. This is a project I worked on to refine my Node.JS skills.

## Quick Start

### Prerequisites

- Node.js 20.x
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/nft-metadata-api.git
cd nft-metadata-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Configuration

```bash
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nft_metadata

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RPC Endpoints (Get keys from Alchemy/Infura)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
STARKNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/v2/YOUR_KEY

# IPFS
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret

# API Security
API_TEST_KEY=test_api_key_min_16_chars
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_DAY=1000
```

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Running Locally

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run in development mode
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All endpoints (except `/health`) require an API key:

```bash
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/nft/ethereum/0xabc/1
```

### Interactive Documentation

Access the Swagger UI at:

```
http://localhost:3000/api/docs
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific test suite
npm test -- --testPathPattern=nft.service
```

## Project Structure

```
nft-metadata-api/
├── src/
│   ├── modules/
│   │   ├── nft/          # NFT endpoints & orchestration
│   │   ├── blockchain/   # Chain-specific services
│   │   ├── metadata/     # IPFS & metadata parsing
│   │   ├── cache/        # Two-tier caching
│   │   └── analytics/    # Request tracking
│   ├── common/
│   │   ├── guards/       # Auth & rate limiting
│   │   ├── filters/      # Exception handling
│   │   └── interceptors/ # Logging
│   └── main.ts
├── test/                 # E2E tests
├── docker-compose.yml
└── Dockerfile
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
