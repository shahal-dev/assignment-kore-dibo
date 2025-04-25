# Assignment Harbor

A platform for students to get help with their assignments from verified experts.

## Running with Docker

### Prerequisites

- Docker
- Docker Compose

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/assignmentharbor

# JWT
JWT_SECRET=your-jwt-secret-key

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### Running the Application

1. Build and start the containers:
   ```bash
   docker compose up --build
   ```

2. The application will be available at:
   - Frontend: http://localhost:5001
   - API: http://localhost:5001/api

### Development

For development, you can use:
```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

### Production

For production deployment:
```bash
# Build and start containers
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f
```

### Database Management

The database is automatically initialized when you start the containers. To run migrations:

```bash
# Inside the app container
docker compose exec app yarn db:push
```

## Security

- Uses secure Node.js base image with pinned digest
- Runs as non-root user in Docker
- Environment variables for sensitive data
- CORS protection
- Rate limiting
- Input validation with Zod
- Password hashing with scrypt
- JWT for session management
