# LocalAWS - AWS Services Emulator

A local AWS emulator for development and testing. Runs EC2, S3, and RDS services using Docker containers with a React web console.

## Architecture

![image.png](attachment:ccfdc771-4006-4edd-845e-7c03acb35553:image.png)

## Tech Stack

- **Backend**: FastAPI, SQLite, Docker SDK, JWT auth
- **Frontend**: React, Tailwind CSS, xterm.js
- **Services**: Docker containers for EC2/RDS, local filesystem for S3
- **Auth**: JWT tokens with admin/password login

## Quick Start

```bash
# Clone and run
git clone <repo-url>
cd localaws
docker-compose up --build

# Access at http://localhost:3000
# Login: admin / password

```

## API Routes

### Authentication

| Method | Route | Description |
| --- | --- | --- |
| POST | `/auth/login` | Login with username/password, get JWT token |

### EC2 Service

| Method | Route | Description |
| --- | --- | --- |
| POST | `/ec2/instances` | Create new instance (specify AMI like alpine:latest) |
| GET | `/ec2/instances` | List all instances |
| POST | `/ec2/instances/{id}/start` | Start stopped instance |
| POST | `/ec2/instances/{id}/stop` | Stop running instance |
| DELETE | `/ec2/instances/{id}` | Delete instance |
| WebSocket | `/ec2/instances/{id}/console` | Open web terminal to instance |

### S3 Service

| Method | Route | Description |
| --- | --- | --- |
| POST | `/s3/buckets` | Create bucket |
| GET | `/s3/buckets` | List buckets |
| POST | `/s3/buckets/{name}/objects` | Upload object |
| GET | `/s3/buckets/{name}/objects` | List objects in bucket |

### RDS Service

| Method | Route | Description |
| --- | --- | --- |
| POST | `/rds/db-instances` | Create PostgreSQL database |
| GET | `/rds/db-instances` | List database instances |
| DELETE | `/rds/db-instances/{id}` | Delete database instance |

## Features

### EC2 Emulation

- Create instances using Docker images (alpine:latest, ubuntu:latest)
- Start/stop/delete lifecycle management
- Web console access via browser terminal
- Instance metadata stored in SQLite

### S3 Emulation

- Create/delete buckets (directories on disk)
- Upload/download objects (files)
- Simple REST API compatible

### RDS Emulation

- PostgreSQL database instances in Docker containers
- Dynamic port allocation for external connections
- Connection details with copy-to-clipboard functionality
- Database credentials management

## Project Structure

```
localaws/
├── backend/                    # FastAPI application
│   ├── services/              # Service modules (EC2, S3, RDS)
│   ├── models.py              # Pydantic data models
│   ├── auth.py                # JWT authentication
│   ├── main.py                # FastAPI app entry point
│   ├── Dockerfile             # Alpine-based Python container
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React application
│   ├── src/components/        # React components
│   ├── src/pages/            # Page components
│   ├── Dockerfile            # Alpine-based Node container
│   └── package.json          # Node dependencies
├── data/                     # Persistent storage
│   ├── metadata/            # SQLite database
│   └── s3/                  # S3 object storage
└── docker-compose.yml       # Service orchestration

```

## Technical Implementation Details

### Database Schema

```sql
-- EC2 instances metadata
CREATE TABLE instances (
    id VARCHAR PRIMARY KEY,           -- Docker container ID
    ami_id VARCHAR NOT NULL,          -- Docker image name
    instance_type VARCHAR DEFAULT 't2.micro',
    status VARCHAR NOT NULL,          -- running/stopped/terminated
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- S3 buckets metadata
CREATE TABLE buckets (
    name VARCHAR PRIMARY KEY,         -- Unique bucket name
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RDS instances metadata
CREATE TABLE db_instances (
    id VARCHAR PRIMARY KEY,           -- Docker container ID
    db_name VARCHAR NOT NULL,         -- PostgreSQL database name
    username VARCHAR NOT NULL,        -- DB username
    password VARCHAR NOT NULL,        -- DB password
    endpoint VARCHAR NOT NULL,        -- Connection host
    port INTEGER NOT NULL,            -- Mapped port
    engine VARCHAR DEFAULT 'postgres',
    status VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

```

### Key Technologies Used

### Backend Framework

- **FastAPI**: Modern async web framework with automatic API documentation
- **Pydantic**: Data validation and serialization with type hints
- **SQLAlchemy**: Python ORM for database operations
- **PyJWT**: JSON Web Token implementation for authentication
- **Docker SDK**: Python library for Docker API interaction
- **WebSockets**: Real-time bidirectional communication for terminal access

### Frontend Stack

- **React 18**: Component-based UI library with hooks
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **xterm.js**: Full-featured terminal emulator for web browsers
- **Axios**: HTTP client with request/response interceptors
- **React Router**: Client-side routing for single-page application

### Infrastructure & DevOps

- **Docker**: Containerization platform for consistent deployment
- **Docker Compose**: Multi-container application orchestration
- **Alpine Linux**: Minimal base images for reduced container size
- **SQLite**: Embedded database for metadata storage
- **Nginx**: Reverse proxy and load balancer (optional)

### Security Implementation

- JWT-based stateless authentication
- Bearer token authorization for API endpoints
- CORS configuration for cross-origin requests
- Container isolation for service security
- Environment variable configuration for secrets

### Performance Optimizations

- Alpine Linux base images (total footprint <200MB)
- SQLite for fast metadata queries
- Async/await patterns in FastAPI for concurrent request handling
- Docker volume mounts for persistent data
- Efficient WebSocket connections for real-time features

## Development Workflow

### Local Development Setup

```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend
npm install
npm start

```

### Testing Strategy

- Unit tests with pytest for backend logic
- Integration tests for API endpoints
- Component tests with React Testing Library
- End-to-end tests with Docker Compose
- WebSocket connection testing for terminal functionality

### Deployment Considerations

- Multi-stage Docker builds for optimized images
- Health checks for container orchestration
- Log aggregation and monitoring setup
- Backup strategies for SQLite and S3 data
- Scaling considerations for multiple instances

---

### Technical Concepts to Highlight

**System Design & Architecture**

- Microservices architecture with clear separation of concerns
- Container orchestration using Docker Compose
- RESTful API design principles and WebSocket integration
- Database design with proper normalization and indexing
- Stateless authentication using JWT tokens

**Full-Stack Development Skills**

- Backend: FastAPI async programming, ORM usage, Docker SDK integration
- Frontend: Modern React patterns, real-time UI updates, responsive design
- DevOps: Containerization, service orchestration, environment management

**Problem-Solving Approach**

- AWS service emulation through Docker container abstraction
- Real-time terminal access via WebSocket streams
- File system abstraction for S3-compatible storage
- Dynamic port allocation for database connections

**Code Quality & Best Practices**

- Type hints and Pydantic validation for robust APIs
- Modular code structure with clear service boundaries
- Error handling and proper HTTP status codes
- Security considerations (authentication, container isolation)
- Documentation and API schema generation

**Scalability & Performance**

- Async/await patterns for concurrent request handling
- Lightweight Alpine Linux containers for resource efficiency
- SQLite for fast local storage with migration path to PostgreSQL
- Modular architecture allowing easy addition of new AWS services
