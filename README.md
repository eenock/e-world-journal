# E-World Journal App

A modern, feature-rich journaling application built with React Native and Expo.

## Features

- 📝 **Rich Text Journaling**: Create entries with formatting, images, and voice notes
- 😊 **Mood Tracking**: Track your emotional state with each entry
- 🤖 **AI Chat Assistant**: Get support and insights from an AI companion
- 📊 **Analytics & Insights**: Visualize mood trends and discover patterns
- 🔐 **Secure & Private**: Biometric authentication and encrypted storage
- ☁️ **Cloud Sync**: Automatic backup with Supabase
- 💎 **Premium Features**: Unlimited history, AI insights, and data export
- 🌙 **Dark Mode**: Easy on your eyes
- 📱 **Offline Support**: Write anytime, sync later

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: RevenueCat
- **AI**: Groq (LLaMA 3.1), OpenAI (Embeddings)
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Animations**: Reanimated

## Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI
- Expo account
- Supabase account
- RevenueCat account (for subscriptions)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd e-world-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your-ios-key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your-android-key
EXPO_PUBLIC_GROQ_API_KEY=your-groq-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
EXPO_PUBLIC_POSTHOG_API_KEY=your-posthog-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. Update app.json

Update `app.json` with your project details:

- Bundle identifier: `com.yourcompany.eworld`
- Project ID (EAS)
- Supabase configuration in `extra`

### 5. Database Setup

Run the migrations in your Supabase project:

```sql
-- See supabase/migrations/ for SQL files
```

Generate database types:

```bash
npm run generate-types
```

### 6. Run the app

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
e-world-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth flow
│   ├── (onboarding)/      # Onboarding
│   ├── (tabs)/            # Main tabs
│   └── entry/             # Entry screens
├── assets/                # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   ├── journal/       # Journal-specific
│   │   └── ui/            # UI primitives
│   ├── config/            # App configuration
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Third-party integrations
│   ├── services/          # API services
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── supabase/              # Database migrations
└── tests/                 # Test files
```

## Development

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format
```

### Testing

```bash
# Run tests
npm test

# Coverage
npm run test:coverage
```

## Building for Production

### iOS

```bash
# Build
npm run build:ios

# Submit to App Store
npm run submit:ios
```

### Android

```bash
# Build
npm run build:android

# Submit to Play Store
npm run submit:android
```

## Database Schema

### Core Tables

- `users`: User profiles and preferences
- `entries`: Journal entries
- `moods`: Mood definitions
- `prompts`: Writing prompts
- `attachments`: Media files
- `chat_messages`: AI chat history
- `insights`: Generated insights
- `subscriptions`: Premium subscriptions

### Key Features

- Row Level Security (RLS) enabled
- Automatic timestamping
- Cascade deletes
- Vector search for semantic entry search

## Security

- Environment variables for sensitive data
- Row Level Security in Supabase
- Secure token storage with Expo SecureStore
- Biometric authentication
- HTTPS only
- Input validation with Zod

## Analytics

The app tracks:

- User engagement
- Feature usage
- Subscription conversions
- Error rates
- Performance metrics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For issues or questions:

- Email: support@eworld.app
- GitHub Issues: [link]

## License

[Your License]

## Acknowledgments

- Expo team for the amazing framework
- Supabase for the backend infrastructure
- RevenueCat for subscription management
- Community contributors