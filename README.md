# Optimeal AI 🍽️

**Eat Smarter. Spend Less. Live Healthier.**

AI-powered meal planning + grocery price comparison for UK households. Save money, eat healthier, and plan smarter with intelligent meal optimization tailored for the UK market.

![Optimeal AI Banner](https://via.placeholder.com/800x400/4CAF50/FFFFFF?text=Optimeal+AI+-+Smart+Meal+Planning)

## 🌟 About

Optimeal AI revolutionizes how UK households approach meal planning and grocery shopping. By combining artificial intelligence with real-time price data from major UK supermarkets, we help families eat healthier while saving money and time.

### The Problem We Solve

- **Meal Planning Struggles**: Difficulty creating healthy, varied meal plans
- **Budget Overruns**: Overspending on groceries without realizing it  
- **App Juggling**: Managing multiple apps for recipes, budgeting, and shopping
- **Price Confusion**: Not knowing where to shop for the best deals

### Our Solution

**Optimeal AI** provides an all-in-one platform that:
- Creates personalized, health-aligned meal plans
- Tracks weekly & monthly grocery budgets
- Compares prices across Sainsbury's, Tesco, Asda, Lidl, and Aldi
- Optimizes store selection for maximum time and money savings

## 🚀 Key Features

### 🤖 AI Meal Planning
- Personalized meal plans based on dietary preferences and health goals
- Adaptable to dietary restrictions (vegan, gluten-free, keto, etc.)
- Family-friendly options with portion scaling

### 💰 Smart Budget Tracking  
- Weekly and monthly grocery budget monitoring
- Spending insights and trend analysis
- Cost-per-meal breakdowns

### 🛒 Price Comparison Engine
- Real-time prices from all major UK supermarkets
- Automated deal detection and alerts
- Brand and generic alternative suggestions

### 📍 Store Optimization
- Route planning for multi-store shopping
- Time vs. savings trade-off calculations
- Local store inventory awareness

### 🎯 Rewards & Motivation
- Achievement badges for budget goals
- Healthy eating streaks  
- Community challenges

### 🍛 AI Co-pilot Chat
- Get personalized cooking advice and recipe suggestions
- Interactive chat assistant for cooking questions
- Step-by-step cooking guidance for recipes

### 📸 Additional Features
- Food image analysis for nutritional insights
- Recipe conversion (traditional to quick versions)
- Western grocery substitutions for specialty ingredients
- Daily nutrition and fitness tracking

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
MONGO_URL="mongodb://localhost:27017"
DB_NAME="optimeal_db"
CORS_ORIGINS="*"
GROQ_API_KEY="your_groq_api_key_here"
EMERGENT_LLM_KEY="your_api_key"
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

- **Landing Page**: Open `index.html` directly in browser or serve locally
- **Frontend App**: http://localhost:3000  
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 7. Landing Page (Marketing Site)

The main landing page (`index.html`) showcases Optimeal AI features with:
- **Mobile-first responsive design** with animated backgrounds
- **Interactive phone mockup** demonstrating AI chat functionality
- **Waitlist signup forms** with analytics tracking
- **10 comprehensive sections**: Hero, Problems, Solutions, Features, How It Works, Benefits, Social Proof, FAQ, and CTAs
- **Google Analytics 4 integration** for user behavior tracking
- **UK-focused branding** with local supermarket mentions

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

## 🎯 Target Audience

### Primary Users
- **UK Families** looking to optimize their grocery spending
- **Health-conscious individuals** wanting better meal planning  
- **Budget-conscious households** seeking to reduce food waste
- **Busy professionals** needing efficient meal preparation

### Use Cases
- Weekly meal planning and grocery budgeting
- Comparing prices across multiple UK supermarkets
- Finding healthy recipes that fit dietary restrictions
- Optimizing shopping routes and store selection
- Tracking nutritional goals and spending patterns

## 🔮 Roadmap

### Phase 1: MVP (Current)
- ✅ Landing page with waitlist signup
- ✅ Basic AI chat functionality  
- ✅ Recipe conversion system
- ✅ Price comparison framework

### Phase 2: Core Features
- [ ] User authentication and profiles
- [ ] Real-time price data integration
- [ ] Advanced meal planning algorithms
- [ ] Mobile app development

### Phase 3: Advanced Features
- [ ] Social sharing and community features
- [ ] Integration with grocery delivery services
- [ ] Advanced analytics and insights
- [ ] Voice assistant integration

## 📞 Contact & Support

- **Website**: [Optimeal AI Landing Page](https://tamoghna12.github.io/homeland_meals/)
- **Email**: support@optimeal.ai (placeholder)  
- **Issues**: Create an issue in this repository

## 🙏 Acknowledgments

- Created by a PhD researcher in bioinformatics & AI product builder
- Powered by Groq's Llama-3.1-8b-instant model
- Designed for the UK market with local supermarket integration
- Built with modern web technologies for optimal performance

---

**Ready to transform your meal planning?** [Join our waitlist](https://tamoghna12.github.io/homeland_meals/) to be among the first 500 users to get early access!
