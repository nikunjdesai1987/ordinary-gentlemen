# Ordinary Gentlemen - FPL League

A modern Fantasy Premier League application built with Next.js, featuring real-time predictions, league standings, and comprehensive statistics.

## 🚀 Tech Stack

### Frontend UI Layer
- **Framework**: Next.js 14 (React + Routing + SSR)
- **Styling**: Tailwind CSS
- **Components**: Headless UI for accessible components
- **Icons**: Heroicons

### Authentication Layer
- **Service**: Firebase Authentication
- **Method**: Google Sign-In only (OAuth 2.0)
- **Hooks**: react-firebase-hooks for session handling
- **Output**: UID, email, displayName

### Local Data Layer
- **Local DB**: Dexie.js (IndexedDB wrapper)
- **Usage**: Store Score & Strike predictions, user info, gameweek summaries
- **Schema**: Tables for predictions, users, gameweek summaries, league standings
- **Querying**: Indexed fields, async CRUD operations

### Data API Layer
- **Source**: Fantasy Premier League (FPL) API
- **Fetch Tool**: Axios with caching
- **Data**: League standings, team data, chips, gameweeks
- **Refresh**: Weekly or on-demand

### Deployment Layer
- **Host**: Vercel (preferred for Next.js)
- **Domain**: Custom or Vercel subdomain
- **SSL**: Automatic
- **CI/CD**: GitHub → Vercel auto-deploy

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Authentication enabled
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ordinary-gentlemen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Create a Firestore database
   - Add your domain to authorized domains
   - Create a `whitelist` collection in Firestore with user emails as documents

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ordinary-gentlemen/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── LoginPage.tsx      # Authentication page
│   ├── Dashboard.tsx      # Main dashboard
│   └── tabs/              # Tab components
│       ├── NewsTab.tsx
│       ├── StandingsTab.tsx
│       ├── ScoreStrikeTab.tsx
│       └── StatisticsTab.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── database.ts        # Dexie.js database
│   └── fpl-api.ts         # FPL API service
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 Features

### Authentication
- Google OAuth integration
- Whitelist-based access control
- Persistent session management

### Dashboard
- **Latest News**: Football news and updates
- **League Standing**: Real-time FPL table
- **Score n Strike**: Match prediction game
- **Statistics**: Personal and league statistics

### Local Storage
- Offline-capable predictions
- User data persistence
- Gameweek summaries
- League standings cache

### Real-time Updates
- Live match status
- Prediction deadlines
- League position updates

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Ensure all Firebase configuration variables are set in your deployment platform.

## 🔒 Security

- Firebase Authentication with Google OAuth
- Firestore security rules
- Client-side data validation
- CORS configuration for API calls

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the Firebase documentation for authentication issues

---

**Built with ❤️ for the Ordinary Gentlemen FPL League**
