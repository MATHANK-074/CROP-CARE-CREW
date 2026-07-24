# CROP-CARE-CREW

<div align="center">

![AgriTech Banner](app/public/hero.jpg)

**An intelligent agricultural management system that empowers farmers with AI-driven insights, disease detection, and comprehensive farm management tools.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-2.18-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[Live Demo](#) • [Documentation](#-project-structure) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>

---

## Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## About the Project

AgriTech is a comprehensive agricultural platform designed to help farmers make data-driven decisions. From AI-powered plant disease detection to real-time weather forecasting and market price tracking, AgriTech provides all the tools modern farmers need in one place.

### Why AgriTech?

- ** Farmer-Centric Design** - Built with input from real farmers
- ** Mobile-First** - Progressive Web App works on any device
- ** Accessible** - Multi-language support (English, Hindi, Tamil)
- ** Fast & Lightweight** - Optimized for low-bandwidth connections
- ** Cost-Effective** - Deployed on free-tier services

---

## Key Features

### AI Plant Disease Detection
Upload photos of your plants and get instant disease identification using a TensorFlow Lite model trained on 38+ plant diseases. Includes treatment recommendations and confidence scores.

**Supported Plants:**
- Apples, Blueberries, Cherries
- Corn, Grapes, Oranges
- Peaches, Peppers, Potatoes
- Raspberries, Soybeans, Squash
- Strawberries, Tomatoes, and more!

### Smart Crop Recommendations
Get personalized crop suggestions based on:
- Soil type and pH levels
- Climate conditions
- Geographic location
- Historical yield data

### Weather Analysis & Forecasts
- Real-time weather data from Tomorrow.io API
- 7-day forecasts with hourly breakdowns
- Agricultural weather insights (frost alerts, rain predictions)
- Temperature, humidity, wind speed tracking

### Market Prices
- Live commodity prices for major crops
- Historical price trends
- Best time to sell recommendations
- Regional market variations

### Government Schemes
Access information about:
- Agricultural subsidies
- Insurance programs
- Training initiatives
- Financial assistance schemes

### Task Management
- Create and track farming activities
- Set reminders for planting, harvesting, spraying
- Calendar view of all tasks
- Task recommendations based on crop type

### User Profiles & Authentication
- Secure JWT-based authentication
- Profile management
- Farm details tracking
- Activity history

### Multi-Language Support
- English (en)
- Hindi (hi)
- Tamil (ta)
- Easy to add more languages

---

## Tech Stack

### Frontend
- **Framework:** React 18.3 with Vite
- **Styling:** TailwindCSS, Custom CSS
- **State Management:** Context API
- **Routing:** React Router v6
- **Internationalization:** i18next
- **HTTP Client:** Axios
- **UI Components:** Custom components, Lucide icons

### Backend (Node.js)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Email:** Nodemailer
- **Security:** bcryptjs, CORS

### AI/ML Service (Python)
- **Framework:** FastAPI
- **ML Model:** TensorFlow Lite (3MB optimized model)
- **Image Processing:** Pillow (PIL)
- **Model:** Plant disease classifier (39 classes)

### External APIs
- **Weather Data:** Tomorrow.io API
- **Government Schemes:** Custom API integration

### DevOps & Deployment
- **Hosting:** Render (Free Tier)
- **Version Control:** Git & GitHub
- **CI/CD:** Render auto-deploy from GitHub

---

## Project Structure

```
AgriTech/
├── app/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── auth/           # Login, Signup
│   │   │   ├── crops/          # Crop management
│   │   │   ├── header/         # Navigation
│   │   │   ├── home/           # Home page components
│   │   │   ├── schemes/        # Government schemes
│   │   │   ├── tasks/          # Task management
│   │   │   ├── ui/             # Reusable UI components
│   │   │   └── weather/        # Weather components
│   │   ├── contexts/           # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── locales/            # Translations (en, hi, ta)
│   │   ├── styles/             # CSS files
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # App entry point
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Vite configuration
│   └── tailwind.config.js      # TailwindCSS config
│
├── server/                      # Backend (Node.js + Express)
│   ├── models/                 # MongoDB models
│   │   ├── User.js            # User schema
│   │   ├── Crop.js            # Crop schema
│   │   ├── Task.js            # Task schema
│   │   ├── Activity.js        # Activity schema
│   │   └── disease.js         # Disease schema
│   ├── routes/                 # API routes
│   │   ├── auth.js            # Authentication routes
│   │   ├── crops.js           # Crop management routes
│   │   ├── tasks.js           # Task management routes
│   │   ├── activities.js      # Activity tracking routes
│   │   ├── disease.js         # Disease detection routes
│   │   └── cropAIEnrichment.js # AI crop enrichment
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── utils/
│   │   ├── mailer.js          # Email utilities
│   │   └── taskRecommendationGenerator.js
│   ├── uploads/               # User uploaded files
│   ├── server.js              # Express app entry point
│   └── package.json           # Dependencies
│
├── image-based-ident-api/      # AI/ML Service (FastAPI)
│   ├── main.py                # FastAPI app
│   ├── model.tflite           # TensorFlow Lite model (3MB)
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # API documentation
│
├── README.md                   # This file
└── .gitignore                 # Git ignore rules
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ and pip
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/mathankumar/agri-tech.git
cd agri-tech
```

#### 2. Setup Frontend

```bash
cd app
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The frontend will run on `http://localhost:5173`

#### 3. Setup Backend (Node.js)

```bash
cd ../server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
node server.js
```

The backend will run on `http://localhost:5001`

#### 4. Setup AI/ML Service (Python)

```bash
cd ../image-based-ident-api
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The AI service will run on `http://localhost:8000`

---

## Deployment

### Frontend (Render Static Site)

1. Create a new **Static Site** on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `./app`
   - **Build Command:** `npm install; npm run build`
   - **Publish Directory:** `app/dist`
4. Add environment variables (see below)
5. Deploy!

### Backend (Render Web Service)

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `./server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add environment variables
5. Deploy!

### AI/ML Service (Render Web Service)

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `./image-based-ident-api`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. No environment variables needed (uses local model.tflite)
5. Deploy!

**Note:** The TensorFlow Lite model is optimized to run on Render's free tier (512MB RAM).

---

## Environment Variables

### Frontend (`app/.env`)

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_ML_API_BASE_URL=http://localhost:8000
VITE_TOMORROW_API_KEY=your_tomorrow_io_api_key
```

### Backend (`server/.env`)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/agritech
# or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agritech

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email (Optional - for notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# External APIs
GOV_API_KEY=your_government_api_key

# Server
PORT=5001
NODE_ENV=development
```

### AI/ML Service (`image-based-ident-api/.env`)

No environment variables needed! The service automatically uses the local `model.tflite` file.

---

## API Documentation

### Backend API (Node.js)

**Base URL:** `http://localhost:5001` (development)

#### Authentication

```http
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/profile (requires JWT)
```

#### Crops

```http
GET    /api/crops (requires JWT)
POST   /api/crops (requires JWT)
PUT    /api/crops/:id (requires JWT)
DELETE /api/crops/:id (requires JWT)
```

#### Tasks

```http
GET    /api/tasks (requires JWT)
POST   /api/tasks (requires JWT)
PUT    /api/tasks/:id (requires JWT)
DELETE /api/tasks/:id (requires JWT)
```

#### Disease Detection

```http
POST /api/disease/detect (multipart/form-data, requires JWT)
GET  /api/disease/history (requires JWT)
```

### AI/ML API (FastAPI)

**Base URL:** `http://localhost:8000` (development)

#### Endpoints

```http
GET  /ping
     Returns: {"message": "ok"}

GET  /model-status
     Returns: {"loaded": true, "model_exists": true, ...}

POST /predict
     Content-Type: multipart/form-data
     Body: file (image file)
     Returns: {"class": "disease_name", "confidence": 0.95, ...}
```

**Interactive API Docs:** Visit `http://localhost:8000/docs` when running locally

---

## Features in Detail

### Disease Detection Flow

1. User uploads plant image via frontend
2. Frontend sends image to Node.js backend (`/api/disease/detect`)
3. Backend forwards image to FastAPI service (`/predict`)
4. TensorFlow Lite model processes image (224x224 RGB)
5. Returns disease class + confidence score
6. Backend saves to database and returns result to frontend
7. Frontend displays disease name, confidence, and treatment suggestions

### Weather Integration

- Fetches data from Tomorrow.io API
- Displays current conditions and 7-day forecast
- Shows agricultural metrics (frost risk, rainfall probability)
- Caches data to reduce API calls

### Task Recommendations

- AI-generated task suggestions based on crop type
- Considers planting date and growth cycle
- Seasonal recommendations
- Customizable task templates

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes locally
- Update documentation if needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

**Mathankumar** - [@mathankumar](https://github.com/mathankumar)

---

## Acknowledgments

- Plant disease dataset from PlantVillage
- Weather data from Tomorrow.io
- Icons from Lucide React
- Inspiration from farmers worldwide

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for farmers everywhere

</div>
