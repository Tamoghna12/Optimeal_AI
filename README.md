# Nutrichef AI

**Your AI cooking assistant for South Asian cuisine**

A full-stack nutrition and recipe application that helps you cook authentic South Asian dishes using ingredients from your local grocery store. Perfect for busy students and professionals who want a taste of home!

## Features

🍛 **AI Co-pilot Chat** - Get personalized cooking advice and recipe suggestions  
📸 **Food Analysis** - Upload food images for instant nutritional analysis  
📱 **Recipe Converter** - Transform traditional recipes into quick, modern versions  
🥘 **Ingredient Substitutions** - Find Western grocery alternatives for South Asian ingredients  
📊 **Nutrition Tracking** - Track daily calories, macros, and fitness goals  
💰 **Meal Cost Estimation** - Plan budget-friendly meals with pricing data

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Docker** (for MongoDB)
- **Yarn** package manager

### 1. Clone Repository

```bash
git clone <repository-url>
cd homeland_meals
```

### 2. Environment Setup

Create `.env` files in both directories:

**Backend** (`backend/.env`):
```env
MONGODB_URL=mongodb://localhost:27017/homeland_meals
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGINS=["http://localhost:3000"]
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Database Setup

```bash
# Start MongoDB with Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

### 4. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend Setup

```bash
# In a new terminal
cd frontend
yarn install
yarn start
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## API Key Setup

### Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Create account and generate API key
3. Add to `backend/.env` as `GROQ_API_KEY=your_key_here`

## Production Deployment

### Docker Deployment

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017/homeland_meals
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - mongodb
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Deploy Commands

```bash
# Build and start all services
docker-compose up -d

# Scale backend instances
docker-compose up -d --scale backend=3

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cloud Deployment Options

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

#### Railway (Full Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Heroku (Backend)
```bash
# Install Heroku CLI and login
heroku create desi-kitchen-api

# Set environment variables
heroku config:set GROQ_API_KEY=your_key_here
heroku config:set MONGODB_URL=your_mongodb_atlas_url

# Deploy
git push heroku main
```

## Development

### Testing

```bash
# Backend API tests
python backend_test.py

# Frontend tests
cd frontend
yarn test
```

### Code Quality

```bash
# Backend linting
cd backend
black .
isort .
flake8 .
mypy .

# Frontend linting
cd frontend
yarn lint
```

### Project Structure

```
homeland_meals/
├── frontend/                 # React application
│   ├── src/
│   │   ├── data/            # Recipe and ingredient data
│   │   ├── App.js           # Main app with co-pilot
│   │   └── App.css          # Custom styling
│   ├── public/
│   └── package.json
├── backend/                  # FastAPI application
│   ├── emergentintegrations/ # Custom AI integration
│   ├── server.py            # Main server file
│   ├── backend_test.py      # API tests
│   └── requirements.txt
├── docker-compose.yml       # Development setup
├── CLAUDE.md               # Developer guide
└── README.md               # This file
```

## API Endpoints

### Core Features
- `POST /api/profile` - User profile with BMR calculations
- `POST /api/analyze-food` - AI food image analysis
- `POST /api/recipe` - Recipe creation with quick conversion
- `GET /api/daily-stats/{user_id}/{date}` - Daily nutrition stats

### Co-pilot Features
- `POST /api/copilot/chat` - Interactive cooking assistant
- `POST /api/copilot/recipe-suggestions` - Ingredient-based recipes
- `POST /api/copilot/cooking-guidance` - Step-by-step guidance

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
docker ps
# Restart MongoDB
docker restart mongodb
```

**CORS Issues**
- Ensure frontend URL is in `CORS_ORIGINS` environment variable
- Check that backend is running on correct port

**AI API Errors**
- Verify `GROQ_API_KEY` is set correctly
- Check API quota and rate limits

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# Clear Python cache
find . -type d -name __pycache__ -delete
pip install -r requirements.txt --force-reinstall
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

- 📧 **Email**: support@desikitchen.com
- 💬 **Discord**: [Join Community](https://discord.gg/desikitchen)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/homeland_meals/issues)
- 📖 **Documentation**: [Full Docs](https://docs.desikitchen.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the South Asian diaspora**
