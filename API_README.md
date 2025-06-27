# FRC 7790 Baywatch Robotics - API Backend

## Overview

This is the Cloudflare Pages Functions backend for the FRC 7790 Baywatch Robotics website. It provides authentication, calendar management, and task management APIs using Hono framework and D1 database.

## Tech Stack

- **Runtime**: Cloudflare Pages Functions
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: JWT with SHA-256 password hashing
- **Language**: TypeScript

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns JWT token)

### Calendar (Requires Auth)
- `GET /api/calendar` - Get all calendar events
- `POST /api/calendar` - Create new event
- `PUT /api/calendar/:id` - Update event
- `DELETE /api/calendar/:id` - Delete event

### Tasks (Requires Auth)
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Admin (Requires Admin Auth)
- `GET /api/admin/users` - Get all users

### Utility
- `GET /api/health` - Health check
- `GET /api/` - API info

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   # Run initial migration
   npm run db:migrate
   ```

3. **Environment Variables**
   - Update `JWT_SECRET` in `wrangler.toml` with a secure secret

4. **Start Development Server**
   ```bash
   npm run functions:dev
   ```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Admin Account
- Username: `admin`
- Password: `admin123`

**⚠️ Important: Change the default admin password after first login!**

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password` - SHA-256 hashed password
- `is_admin` - Admin flag (0/1)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Calendar Events Table
- `id` - Primary key
- `title` - Event title
- `start_time` - Event start datetime
- `end_time` - Event end datetime
- `description` - Event description
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Tasks Table
- `id` - Primary key
- `title` - Task title
- `description` - Task description
- `is_completed` - Completion status (0/1)
- `due_date` - Due date
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Security Features

- **Password Hashing**: SHA-256 for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Basic rate limiting middleware
- **Input Validation**: Validation on all endpoints
- **Error Handling**: Comprehensive error handling

## Deployment

1. **Deploy to Cloudflare Pages**
   ```bash
   npm run functions:deploy
   ```

2. **Update Environment Variables**
   - Set production `JWT_SECRET` in Cloudflare dashboard
   - Configure D1 database binding

3. **Run Database Migration on Production**
   ```bash
   wrangler d1 execute frc7790-com --env production --file=migrations/001_initial_schema.sql
   ```

## API Usage Examples

### Register User
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Create Calendar Event
```bash
curl -X POST https://your-domain.com/api/calendar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"title": "Team Meeting", "start_time": "2025-01-15T14:00:00Z", "end_time": "2025-01-15T15:00:00Z"}'
```

### Create Task
```bash
curl -X POST https://your-domain.com/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"title": "Complete robot design", "description": "Finish CAD drawings", "due_date": "2025-01-20T23:59:59Z"}'
```

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling to all endpoints
3. Include input validation
4. Update this README when adding new features
5. Test all endpoints before deploying

## Support

For issues or questions, contact the FRC 7790 development team.
