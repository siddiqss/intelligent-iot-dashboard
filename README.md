# 🏢 IoT Intelligent Dashboard

A production-ready full-stack IoT dashboard application with real-time data visualization, AI-powered analytics, and advanced infrastructure features. Built with Next.js, Express, TypeScript, and OpenAI integration.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![Express](https://img.shields.io/badge/Express-4.18-gray?style=flat&logo=express)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)

## ✨ Features

### Core Functionality
- **Real-time IoT Data Monitoring**: Live building and energy KPIs with automatic 30-second refresh
- **Building Metrics**: Temperature, occupancy, HVAC status, air quality, and humidity
- **Energy Metrics**: Power consumption, efficiency, costs, peak usage, renewable percentage, and carbon footprint
- **Historical Data Visualization**: Interactive time-series charts with CSV export
- **Predictions**: 24-hour forecasts using linear regression analysis
- **Alerts & Anomalies**: Real-time anomaly detection and threshold-based alerts

### AI-Powered Analytics
- **OpenAI Integration**: GPT-4o-mini with structured JSON outputs
- **Intelligent Fallback**: Rule-based analysis when AI is unavailable
- **Context-Aware Analysis**: Historical data integration for better insights
- **Anomaly Detection**: Dual approach (AI-powered + statistical)
- **Actionable Recommendations**: AI-generated optimization suggestions

### Infrastructure & Performance
- **Redis/DragonflyDB Caching**: Configurable TTL-based response caching
- **Rate Limiting**: Industry-standard sliding window algorithm with per-endpoint limits
- **Graceful Degradation**: System works without Redis or OpenAI API
- **Docker Support**: Full containerization with docker-compose
- **Health Checks**: Monitoring endpoints for service status

## 🛠 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Ant Design** - Professional UI component library
- **@ant-design/charts** - Advanced data visualization

### Backend
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **OpenAI API** - AI analytics and insights
- **LangChain** - Optional AI integration framework
- **ioredis** - Redis client for caching and rate limiting

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **DragonflyDB** - High-performance in-memory database (Redis-compatible)

## 📁 Project Structure

```
/
├── frontend/                    # Next.js application
│   ├── app/                    # App router pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx            # Main dashboard page
│   ├── components/             # React components
│   │   ├── AIAnalytics.tsx    # AI insights component
│   │   ├── Alerts.tsx          # Alerts display
│   │   ├── BuildingKPIs.tsx   # Building metrics cards
│   │   ├── Charts.tsx         # Historical charts
│   │   ├── EnergyKPIs.tsx     # Energy metrics cards
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   └── Predictions.tsx   # Forecast visualization
│   ├── lib/                    # Utilities
│   │   └── api.ts             # API client
│   └── package.json
│
├── backend/                    # Express TypeScript server
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── aiRoutes.ts    # AI endpoints
│   │   │   ├── alertRoutes.ts # Alerts & predictions
│   │   │   └── dataRoutes.ts  # Data endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── aiService.ts   # OpenAI integration
│   │   │   ├── dataGenerator.ts # Mock data generation
│   │   │   └── predictionService.ts # Forecasting
│   │   ├── middleware/        # Express middleware
│   │   │   ├── cache.ts       # Redis caching
│   │   │   └── rateLimiter.ts # Rate limiting
│   │   ├── types/             # TypeScript types
│   │   │   └── index.ts
│   │   └── server.ts         # Express setup
│   └── package.json
│
├── docker-compose.yml          # Multi-container setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.9.0 (recommended)
- **npm**, **yarn**, or **pnpm**
- **Docker** and **Docker Compose** (for containerized deployment)
- **OpenAI API Key** (optional, for AI features - fallback available)

### Local Development

#### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> **Note**: If you don't have an OpenAI API key, the AI features will use intelligent fallback analysis based on rule-based logic. The system also works without Redis (caching and rate limiting will be disabled).

#### 3. Run the Application

**Option A: Run both services from root**
```bash
npm run dev
```

**Option B: Run services separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Docker Deployment

#### 1. Create Environment File

Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### 2. Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will:
- Start DragonflyDB (Redis-compatible) for caching and rate limiting
- Build and start the backend service
- Build and start the frontend service
- Make services available on ports 3000 (frontend) and 3001 (backend)

#### 3. Stop Services

```bash
docker-compose down
```

## 📡 API Documentation

### Data Endpoints

#### GET `/api/data/iot`
Returns current IoT data snapshot with caching (30s TTL).

**Query Parameters:**
- `scenario` (optional): Force specific scenario for testing (`extreme_temp_high`, `extreme_temp_low`, `extreme_air_quality`, `extreme_humidity`)

**Response:**
```json
{
  "building": {
    "temperature": 22.5,
    "occupancy": 45,
    "hvacStatus": "active",
    "airQuality": 65,
    "humidity": 52.3,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "energy": {
    "powerConsumption": 145.5,
    "efficiency": 87.5,
    "cost": 14.55,
    "peakUsage": 165.2,
    "renewablePercentage": 42.3,
    "carbonFootprint": 42.1,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/data/history?hours=24`
Returns historical time-series data with caching (5min TTL).

**Query Parameters:**
- `hours` (optional): Number of hours of history (default: 24, max: 168)

**Response:**
```json
{
  "building": {
    "temperature": [
      { "timestamp": "2024-01-15T10:00:00.000Z", "value": 22.3 },
      ...
    ],
    "occupancy": [...],
    "airQuality": [...],
    "humidity": [...]
  },
  "energy": {
    "powerConsumption": [...],
    "efficiency": [...],
    "cost": [...],
    "peakUsage": [...],
    "renewablePercentage": [...]
  }
}
```

### AI Endpoints

#### POST `/api/ai/analyze`
Performs AI analysis on current data with optional historical context.

**Rate Limit**: 20 req/min (production), 100 req/min (development)

**Request Body:**
```json
{
  "currentData": {...},      // Optional, will generate if not provided
  "includeHistory": true     // Optional, include historical context
}
```

**Response:**
```json
{
  "insights": [
    "Temperature is within optimal range",
    "Energy efficiency is good"
  ],
  "trends": "Stable performance with normal variations",
  "anomalies": ["..."],      // Optional, only if anomalies detected
  "recommendations": [
    "Continue monitoring current performance metrics",
    "Consider optimizing HVAC usage during off-peak hours"
  ]
}
```

### Alerts & Predictions Endpoints

#### GET `/api/alerts`
Get all alerts (anomalies + threshold-based alerts).

**Response:**
```json
{
  "alerts": [
    {
      "type": "warning",
      "message": "High temperature detected: 26.5°C",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/alerts/predictions?hours=24`
Get predictions for energy consumption and building metrics.

**Query Parameters:**
- `hours` (optional): Hours to predict ahead (default: 24)

**Response:**
```json
{
  "energy": [
    {
      "powerConsumption": 150.2,
      "cost": 18.02,
      "efficiency": 85.5,
      "timestamp": "2024-01-15T11:30:00.000Z"
    },
    ...
  ],
  "building": [
    {
      "temperature": 22.8,
      "occupancy": 48,
      "airQuality": 68,
      "timestamp": "2024-01-15T11:30:00.000Z"
    },
    ...
  ],
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/alerts/anomalies`
Detect anomalies in current data compared to historical patterns.

**Response:**
```json
{
  "anomalies": [
    "Temperature anomaly: 28.5°C (avg: 22.3°C)",
    "Power consumption anomaly: 200.5 kW (avg: 150.2 kW)"
  ],
  "detectedAt": "2024-01-15T10:30:00.000Z"
}
```

### Rate Limiting

The API implements industry-standard rate limiting with per-endpoint limits:

- **Global**: 200 req/min (production), 1000 req/min (development)
- **Data endpoints**: 300 req/min (production), 600 req/min (development)
- **AI endpoints**: 20 req/min (production), 100 req/min (development)
- **Alert endpoints**: 100 req/min (production), 300 req/min (development)

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

## 💻 Usage

1. **View Dashboard**: Open http://localhost:3000 to see the main dashboard
2. **Monitor KPIs**: Building and energy metrics update automatically every 30 seconds
3. **View Trends**: Scroll down to see interactive historical charts with zoom and pan
4. **Export Data**: Click "Export CSV" on charts to download historical data
5. **AI Analytics**: Click "Analyze Now" in the AI Analytics card to get insights
6. **View Predictions**: See 24-hour forecasts for energy and building metrics
7. **Check Alerts**: Monitor real-time alerts and anomalies

## 🏗 Architecture Highlights

### Data Generation
The application uses a sophisticated mock data generator that:
- Simulates realistic daily patterns (temperature, occupancy, power consumption)
- Generates time-series data with natural variations
- Creates realistic relationships between metrics (e.g., occupancy affects air quality)
- Supports scenario-based generation (normal, high_occupancy, extreme_temp, etc.)
- Includes random variations for realistic simulation

### AI Integration
The AI service provides:
- **OpenAI GPT-4o-mini** integration with JSON mode for structured outputs
- **Optional LangChain** support with graceful fallback
- **Intelligent Fallback**: Rule-based analysis when AI is unavailable
- **Context-Aware Analysis**: Incorporates historical statistics and trends
- **Safety Checks**: Post-processing validation to catch extreme values
- **Statistical Summaries**: Historical data analysis with trend detection

### Caching Strategy
- **Response Caching**: Redis/DragonflyDB with configurable TTL
- **Cache Headers**: `X-Cache: HIT` or `X-Cache: MISS` in responses
- **TTL Configuration**: 30s for current data, 5min for historical data
- **Graceful Degradation**: Works without Redis (caching disabled)

### Rate Limiting
- **Sliding Window Algorithm**: Industry-standard implementation
- **Per-Endpoint Limits**: Different limits based on resource intensity
- **IP-Based Tracking**: Client IP identification with proxy support
- **Standard Headers**: RFC 6585 compliant rate limit headers

## 🧪 Development

### Backend Development

```bash
cd backend
npm run dev    # Development with hot reload (tsx watch)
npm run build  # Build for production (TypeScript compilation)
npm start      # Run production build
```

### Frontend Development

```bash
cd frontend
npm run dev    # Development server (Next.js)
npm run build  # Build for production
npm start      # Run production server
```

### Environment Variables

**Backend** (`.env`):
- `PORT`: Server port (default: 3001)
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)
- `REDIS_URL`: Redis connection URL (default: redis://localhost:6379)
- `NODE_ENV`: Environment (development/production)

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)

## 🔧 Troubleshooting

### Backend not starting
- Check if port 3001 is available: `lsof -i :3001`
- Verify environment variables are set correctly
- Check backend logs for errors
- Ensure Node.js version >= 20.9.0

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
- Check CORS settings in backend (`CORS_ORIGIN`)
- Ensure backend is running on the correct port
- Check browser console for CORS errors

### AI features not working
- Verify `OPENAI_API_KEY` is set (optional - fallback will be used)
- Check API key is valid and has credits
- Review backend logs for API errors
- System will automatically use rule-based fallback if AI unavailable

### Redis/Caching issues
- Redis is optional - system works without it
- Check `REDIS_URL` is correct if using Redis
- For Docker: Ensure DragonflyDB container is running
- Caching will be disabled if Redis is unavailable (graceful degradation)

### Docker issues
- Ensure Docker and Docker Compose are installed
- Check `.env` file exists with required variables
- Review container logs: `docker-compose logs`
- Check container status: `docker-compose ps`
- Rebuild containers: `docker-compose up --build --force-recreate`

### Rate limiting issues
- Check rate limit headers in API responses
- Verify Redis is running for rate limiting (optional)
- Rate limits are more lenient in development mode
- Use `X-RateLimit-Remaining` header to monitor usage

## 📊 Performance Features

- **Response Caching**: Reduces database/API calls with Redis caching
- **Rate Limiting**: Prevents abuse and ensures fair resource usage
- **Efficient Data Generation**: Optimized algorithms for real-time data
- **Lazy Loading**: Frontend components load on demand
- **Error Boundaries**: Prevents app crashes from component errors
- **Graceful Degradation**: System works with partial infrastructure

## 🔒 Security Features

- **CORS Configuration**: Configurable origin restrictions
- **Rate Limiting**: Protection against DDoS and abuse
- **Input Validation**: Type-safe request handling
- **Error Handling**: No sensitive information in error messages
- **Environment Variables**: Secure configuration management

## 📝 License

This project is created for assessment purposes.

## 👤 Author

Developed as part of the Atelic Assessment.

---

**Built with ❤️ using Next.js, Express, TypeScript, and OpenAI**
