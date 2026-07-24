# 🌾 AgriTech Frontend

The frontend application for AgriTech - A Smart Agricultural Management Platform built with React and Vite.

## 🛠️ Tech Stack

- **React 18.3** - UI library
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **i18next** - Internationalization (English, Hindi, Tamil)
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Context API** - State management

## 📁 Project Structure

```
app/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication (Login, Signup)
│   │   ├── crops/          # Crop management
│   │   ├── header/         # Navigation components
│   │   ├── home/           # Home page components
│   │   ├── schemes/        # Government schemes
│   │   ├── tasks/          # Task management
│   │   ├── ui/             # Reusable UI components
│   │   └── weather/        # Weather components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── locales/            # Translation files (en, hi, ta)
│   ├── styles/             # CSS files
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # TailwindCSS config
└── package.json            # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see `../server/README.md`)
- AI/ML service running (see `../image-based-ident-api/README.md`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:5001
   VITE_ML_API_BASE_URL=http://localhost:8000
   VITE_TOMORROW_API_KEY=your_tomorrow_io_api_key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🌐 Deployment

### Deploy to Render (Static Site)

1. Create a new **Static Site** on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Root Directory:** `./app`
   - **Build Command:** `npm install; npm run build`
   - **Publish Directory:** `app/dist`
4. Add environment variables:
   - `VITE_API_BASE_URL` - Your backend API URL
   - `VITE_ML_API_BASE_URL` - Your AI/ML service URL
   - `VITE_TOMORROW_API_KEY` - Your Tomorrow.io API key
5. Deploy!

### Deploy to Other Platforms

After building (`npm run build`), deploy the `dist/` folder to:
- **Netlify** - Drag & drop or connect GitHub
- **Vercel** - Import project from GitHub
- **GitHub Pages** - Use `gh-pages` package
- **Any Static Host** - Upload `dist/` contents

## ✨ Key Features

### 🔐 Authentication
- JWT-based authentication
- Login and signup forms
- Protected routes
- Profile management

### 🌱 Crop Management
- Add and track crops
- Crop recommendations
- Growth stage monitoring
- Harvest predictions

### 🔍 Disease Detection
- Upload plant images
- AI-powered disease identification
- Treatment recommendations
- Detection history

### 🌤️ Weather Forecasting
- Real-time weather data
- 7-day forecasts
- Agricultural insights
- Weather alerts

### 📊 Market Prices
- Live commodity prices
- Price trends
- Best time to sell

### 🏛️ Government Schemes
- Browse available schemes
- Filter by category
- Apply for subsidies
- Track applications

### ✅ Task Management
- Create farming tasks
- Set reminders
- Calendar view
- Task recommendations

### 🌍 Multi-Language
- English (default)
- Hindi (हिंदी)
- Tamil (தமிழ்)
- Easy language switching

## 🎨 Styling

This project uses:
- **TailwindCSS** for utility classes
- **Custom CSS** for specific components (see `src/styles/`)
- **Theme Context** for dark/light mode
- **Responsive design** for mobile-first approach

## 🔧 Configuration

### Vite Config (`vite.config.js`)

- Path aliases (`@` → `src/`)
- Proxy configuration for API calls
- Build optimizations
- Environment variable handling

### Tailwind Config (`tailwind.config.js`)

- Custom color palette
- Extended spacing
- Custom animations
- Plugin configurations

## 📱 Progressive Web App (PWA)

The app can be installed as a PWA:
- Works offline (coming soon)
- Add to home screen
- Push notifications
- Fast loading

## 🌐 Internationalization (i18n)

Translation files are located in `src/locales/`:

```
locales/
├── en/
│   └── translation.json
├── hi/
│   └── translation.json
└── ta/
    └── translation.json
```

To add a new language:
1. Create a new folder in `locales/`
2. Add `translation.json` with translations
3. Update `src/i18n.js` to include the new language

## 🤝 Contributing

1. Follow the existing code style
2. Use functional components with hooks
3. Keep components small and focused
4. Add PropTypes for type checking
5. Write meaningful commit messages

## 📝 Notes

- The frontend communicates with two backends:
  - Node.js/Express server for main API (`VITE_API_BASE_URL`)
  - FastAPI server for AI/ML predictions (`VITE_ML_API_BASE_URL`)
- Images are optimized during build
- Code splitting is enabled for better performance
- ESLint is configured for code quality

## 🐛 Common Issues

### "Cannot connect to API"
- Ensure backend servers are running
- Check `.env` file has correct API URLs
- Verify CORS is enabled on backend

### "Build fails"
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check for syntax errors

### "i18n translations not loading"
- Ensure translation files are in correct format (valid JSON)
- Check language code matches folder name
- Verify i18n initialization in `main.jsx`

## 📞 Support

For issues related to the frontend, open an issue in the main repository.

---

**Part of AgriTech Platform** - See main [README](../README.md) for full project documentation.
