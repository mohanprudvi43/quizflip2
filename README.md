# Quizflip2

Modern full-stack adaptive learning platform with flashcards, adaptive quizzes, spaced repetition, gamification, and analytics.

## Stack

- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## Quick Start

### 1) Backend

```bash
cd backend
npm install
# Windows PowerShell
Copy-Item .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
# Windows PowerShell
Copy-Item .env.example .env
npm run dev
```

## Default Domains

- Science: Physics, Chemistry, Mathematics, Biology
- Technical Skills: Java, C++, SQL
- Language: English

## Project Structure

```text
Quizflip2/
	backend/
		src/
			app.js
			server.js
			config/
				bootstrap.js
				constants.js
				db.js
			controllers/
				adminController.js
				analyticsController.js
				authController.js
				domainController.js
				learnerController.js
			middleware/
				auth.js
				error.js
			models/
				DailyActivity.js
				Domain.js
				Flashcard.js
				LeaderboardSnapshot.js
				LearnerProgress.js
				QuizAttempt.js
				User.js
			routes/
				adminRoutes.js
				analyticsRoutes.js
				authRoutes.js
				domainRoutes.js
				learnerRoutes.js
			services/
				adaptiveEngine.js
			utils/
				token.js
	frontend/
		src/
			App.jsx
			main.jsx
			components/
				AppShell.jsx
				ProtectedRoute.jsx
				Sidebar.jsx
				ThemeToggle.jsx
			context/
				AuthContext.jsx
			pages/
				AdminDashboardPage.jsx
				AuthPage.jsx
				DomainSelectionPage.jsx
				FlashcardLearningPage.jsx
				LandingPage.jsx
				LeaderboardPage.jsx
				PracticePage.jsx
				ProgressDashboardPage.jsx
				QuizPage.jsx
				StreakCalendarPage.jsx
			services/
				api.js
			styles/
				index.css
```

## MongoDB Schema Overview

1. `User`
- `name`, `email`, `password` (bcrypt hash), `role` (`admin` | `learner`), `points`

2. `Domain`
- `category`, `name`, `description`, `createdBy`, `popularityScore`

3. `Flashcard`
- `domainId`, `topic`, `front`, `back`, `mcqOptions`, `answer`, `createdBy`

4. `LearnerProgress`
- `learnerId`, `domainId`, `viewedFlashcards`, `timeSpentSeconds`, `progressPercent`
- `quizzesTaken`, `totalQuestionsAnswered`, `totalCorrectAnswers`, `weakTopics`
- `quizCounter`, `reviewStates[]`

5. `QuizAttempt`
- `learnerId`, `domainId`, `source`, `score`, `totalQuestions`, `accuracy`, `timeTakenSeconds`, `answers[]`

6. `DailyActivity`
- `learnerId`, `dateKey`, `questionsSolved`

7. `LeaderboardSnapshot`
- `period`, `key`, `entries[]`

## REST API Endpoints

### Auth

- `POST /api/auth/register` - Learner registration
- `POST /api/auth/login` - Admin/Learner login

### Domains & Flashcards

- `GET /api/domains` - List domains
- `POST /api/domains` - Create domain (admin)
- `GET /api/domains/:domainId/flashcards` - Get flashcards by domain
- `POST /api/domains/flashcards/upload` - Upload flashcards (admin)

### Learner Adaptive Flow

- `POST /api/learner/start-domain` - Select domain and initialize tracking
- `POST /api/learner/flashcard/view` - Track viewed flashcard, time spent, progress
- `POST /api/learner/quiz/generate` - Generate adaptive quiz (`auto_10_percent`, practice modes)
- `POST /api/learner/quiz/submit` - Submit quiz with confidence ratings
- `GET /api/learner/progress/:domainId` - Domain progress, accuracy, weak topics
- `GET /api/learner/streak` - Heatmap data, current streak, longest streak

### Leaderboard & Analytics

- `GET /api/analytics/leaderboard?period=daily|weekly|domain&domainId=` - Rankings

### Admin Dashboard

- `GET /api/admin/dashboard` - Total users, popularity, quiz accuracy, flashcard effectiveness

## Adaptive Learning Rules (Implemented)

- Confidence `Hard`: show again in next quiz
- Confidence `Medium`: skip one quiz, then repeat
- Confidence `Easy`: delayed repeat (lower frequency)
- Incorrect answers increment per-card difficulty and update weak topic detection

## Frontend Pages

- Landing page
- Login/Register page
- Domain selection page
- Flashcard learning page (flip animation, keyboard nav, progress)
- Quiz page (MCQ + fill blank, timer, confidence selector)
- Practice page (hard, medium, easy, weak topics)
- Progress dashboard
- Streak calendar page (heatmap)
- Leaderboard page
- Admin dashboard (charts)

## UI/UX Features Included

- Glassmorphism cards
- Gradient atmospheric background
- Dark/Light mode toggle
- Sticky sidebar layout
- Animated progress bars
- Hover and reveal micro-interactions
- Skeleton loaders
- Responsive layouts for mobile/tablet/desktop

## Notes

- Before running, ensure local MongoDB is available at `MONGODB_URI`.
- Default admin credentials come from `backend/.env` values:
	- `ADMIN_BOOTSTRAP_EMAIL`
	- `ADMIN_BOOTSTRAP_PASSWORD`
