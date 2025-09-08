# LLM Chat Pro

A professional, full-stack LLM chat application built with Django, React, TypeScript, and PostgreSQL. Features multiple AI model support, real-time chat, user authentication, and a modern UI.

## Features

### Backend (Django)
- **JWT Authentication** with refresh tokens
- **PostgreSQL** database with comprehensive models
- **Multiple LLM Support**:
  - Hugging Face Transformers
  - Ollama (local models)
  - Custom API endpoints
- **Real-time Chat** with streaming support
- **User Management** with profiles and preferences
- **Conversation Management** with archiving and search
- **RESTful API** with comprehensive endpoints
- **Celery** for background tasks
- **Redis** for caching and message queuing
- **Comprehensive Logging** and error handling

### Frontend (React + TypeScript)
- **Modern UI** with Material-UI components
- **Real-time Chat Interface** with streaming
- **User Authentication** (login/signup)
- **Conversation Management** with search and filtering
- **Model Selection** and configuration
- **Profile Management** with settings
- **Responsive Design** for all devices
- **TypeScript** for type safety
- **React Query** for state management
- **Form Validation** with Yup and React Hook Form

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- JWT Authentication
- Hugging Face Transformers
- Ollama
- Gunicorn

### Frontend
- React 18
- TypeScript
- Material-UI
- React Router
- React Query
- React Hook Form
- Yup
- Framer Motion
- Axios

### Infrastructure
- Docker & Docker Compose
- Nginx (production)
- PostgreSQL
- Redis

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llm-chat-pro
   ```

2. **Copy environment file**
   ```bash
   cp env.example .env
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Local Development

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Setup database
   python manage.py migrate
   python manage.py setup_models
   python manage.py createsuperuser
   
   # Start backend
   python manage.py runserver
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Start Redis** (for Celery)
   ```bash
   redis-server
   ```

4. **Start Celery** (in another terminal)
   ```bash
   cd backend
   celery -A llm_project worker --loglevel=info
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=llm_project
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# Frontend Settings
REACT_APP_API_URL=http://localhost:8000/api

# LLM Settings
HUGGINGFACE_API_TOKEN=your-huggingface-token
OLLAMA_BASE_URL=http://localhost:11434
```

### Model Configuration

The application supports multiple LLM providers:

1. **Hugging Face Models**: Set `HUGGINGFACE_API_TOKEN` in your environment
2. **Ollama Models**: Install Ollama and run `ollama pull llama2:7b`
3. **Custom APIs**: Configure in the admin panel

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/logout/` - Logout

### LLM Endpoints
- `GET /api/llm/models/` - List available models
- `POST /api/llm/chat/` - Send chat message
- `POST /api/llm/chat/stream/` - Stream chat response
- `GET /api/llm/conversations/` - List conversations
- `POST /api/llm/conversations/` - Create conversation
- `GET /api/llm/conversations/{id}/` - Get conversation details
- `PUT /api/llm/conversations/{id}/` - Update conversation
- `DELETE /api/llm/conversations/{id}/delete/` - Delete conversation
- `POST /api/llm/conversations/{id}/archive/` - Archive conversation
- `GET /api/llm/conversations/search/` - Search conversations
- `GET /api/llm/preferences/` - Get user preferences
- `PUT /api/llm/preferences/update/` - Update user preferences
- `POST /api/llm/test-model/` - Test model

## Project Structure

```
llm-chat-pro/
├── backend/
│   ├── llm_project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── authentication/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── admin.py
│   ├── llm_service/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── llm_engines.py
│   │   ├── services.py
│   │   └── management/commands/
│   ├── chat/
│   │   ├── models.py
│   │   ├── views.py
│   │   └── serializers.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── contexts/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Features in Detail

### Chat Interface
- Real-time messaging with streaming support
- Markdown rendering with syntax highlighting
- Model selection and parameter tuning
- Conversation history and management
- Search and filtering capabilities

### User Management
- Secure JWT authentication
- User profiles with avatars
- Password change functionality
- User preferences and settings

### Model Management
- Support for multiple LLM providers
- Model testing and configuration
- Parameter tuning (temperature, max tokens, etc.)
- Model status monitoring

### Admin Panel
- Comprehensive admin interface
- User management
- Model configuration
- Conversation monitoring
- System statistics

## Production Deployment

1. **Update environment variables** for production
2. **Set up SSL certificates** for HTTPS
3. **Configure Nginx** as reverse proxy
4. **Set up monitoring** and logging
5. **Configure backup** for PostgreSQL
6. **Set up CI/CD** pipeline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or [contact me](mailto:noahmulleradeyemi@gmail.com).

## Roadmap

- [ ] Voice chat support
- [ ] File upload and processing
- [ ] Advanced model fine-tuning
- [ ] Multi-language support
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Advanced analytics
- [ ] Plugin system
