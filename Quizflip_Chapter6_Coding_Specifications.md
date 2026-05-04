## CHAPTER 6
# CODING SPECIFICATIONS

### 6.1 Installation of Required Libraries

This chapter documents the coding-level implementation details of Quizflip, including dependency setup, backend entry point, and module-wise code specifications.

Backend dependencies (Node.js + Express):

1. express: REST API server and routing.
2. mongoose: MongoDB connection and schema modeling.
3. bcryptjs: password hashing and verification.
4. jsonwebtoken: access token and refresh token handling.
5. cookie-parser: refresh token cookie parsing.
6. cors: allowed-origin request policy.
7. dotenv: environment variable loading.
8. morgan: request logging.
9. multer: PDF upload middleware.
10. pdf-parse: text extraction from uploaded PDF content.
11. zod: request payload validation schemas.

Frontend dependencies (React + Vite):

1. react, react-dom: UI rendering.
2. react-router-dom: route management and protected navigation.
3. axios: API communication.
4. chart.js, react-chartjs-2: progress and analytics charts.
5. react-calendar-heatmap: streak visualization.
6. framer-motion: animation effects.
7. tailwindcss, postcss, autoprefixer: utility-first styling pipeline.
8. konva, react-konva, use-image: concept card visual editor.

Installation steps:

1. Open terminal in backend folder and run npm install.
2. Open terminal in frontend folder and run npm install.
3. Configure environment variables in backend .env file.
4. Start backend with npm run dev.
5. Start frontend with npm run dev.

### 6.2 server.js (Entry Point Equivalent to main.py)

Quizflip uses backend/src/server.js as the startup file (instead of Python main.py).

Purpose:

1. Initialize dotenv configuration.
2. Connect to MongoDB.
3. Execute bootstrap setup for default admin/system data.
4. Start Express server on configured host and port.

Execution sequence:

1. dotenv.config loads runtime variables.
2. connectDb establishes database connectivity.
3. bootstrapSystem prepares initial records.
4. app.listen starts HTTP API service.

### 6.3 Code Snippets

This section summarizes major code flows used in Quizflip.

#### 6.3.1 Initializes MongoDB Database and Bootstrap

Purpose:

1. Ensure persistent storage is available before API requests are handled.
2. Initialize default system state.

Functionality:

1. Database URI is loaded from environment configuration.
2. Mongoose connection is established with error handling.
3. Bootstrap routine provisions default admin and seed setup.
4. Server start proceeds only after successful DB connection.

#### 6.3.2 Authentication and Authorization

Purpose:

1. Secure user login/register flow.
2. Restrict protected routes by role.

Functionality:

1. registerLearner creates learner profile with hashed password.
2. login validates credentials and issues JWT access token.
3. refreshAccessToken renews access session.
4. logout clears refresh token cookie.
5. Middleware validates token and role for learner/admin endpoints.

#### 6.3.3 Index and Root API

Purpose:

1. Provide service health and root API visibility.
2. Support deployment checks and uptime verification.

Functionality:

1. /api/health returns backend status payload.
2. / returns base API message and route hints.
3. Fallback route returns friendly message for unmatched paths.

#### 6.3.4 Register

Purpose:

1. Onboard new learners into Quizflip.

Functionality:

1. Input validation checks name, email, and password.
2. Duplicate email registration is blocked.
3. Learner role is assigned at creation.
4. Access and refresh tokens are generated after success.

#### 6.3.5 Login and Logout

Purpose:

1. Authenticate users and manage session exit.

Functionality:

1. Email/password verification is performed against stored hash.
2. Admin restrictions are checked when configured.
3. Token + role payload is returned for frontend route control.
4. Logout removes active refresh token cookie.

#### 6.3.6 Dashboard and Domain Start

Purpose:

1. Start learner session for a selected domain.

Functionality:

1. Domain existence is validated.
2. LearnerProgress record is created if missing.
3. Domain popularity is incremented for analytics.
4. Domain start response is returned to dashboard flow.

#### 6.3.7 Flashcard Learning

Purpose:

1. Track concept card study progress and pacing.

Functionality:

1. markFlashcardViewed stores viewed card IDs.
2. timeSpentSeconds is accumulated.
3. progressPercent is recalculated.
4. Milestone completion decides quiz prompt trigger.

#### 6.3.8 Quiz Generation and Submission

Purpose:

1. Generate adaptive quizzes and evaluate learner performance.

Functionality:

1. generateQuiz selects cards based on due states, weakness, and mode.
2. Questions are built from selected flashcards.
3. submitQuiz computes score and accuracy.
4. Spaced repetition schedule is updated using confidence input.
5. Weak topics are recalculated after each submission.

#### 6.3.9 Progress Analytics

Purpose:

1. Maintain measurable learning outcomes for each learner.

Functionality:

1. LearnerProgress stores quizzesTaken, progressPercent, and totals.
2. Weak topic arrays power targeted practice.
3. Progress data is sent to dashboard chart components.

#### 6.3.10 Streak and Leaderboard

Purpose:

1. Improve consistency and motivation through gamified tracking.

Functionality:

1. DailyActivity stores day-wise solved question count.
2. Consecutive-day logic computes streak performance.
3. LeaderboardSnapshot stores sorted ranking entries.
4. Points and performance metrics influence leaderboard position.

#### 6.3.11 Admin Concept Card Generation and Save

Purpose:

1. Enable admin content operations from PDF and text sources.

Functionality:

1. PDF upload endpoint extracts text and generates concept cards.
2. Text input endpoint generates concept cards directly.
3. Preview mode returns generated samples before commit.
4. Save flow supports overwrite for domain card replacement.
5. layout_json and authoredQuiz are normalized before persistence.

### Chapter 6 Summary

Quizflip coding specifications follow a modular full-stack approach. The backend handles secure authentication, adaptive quiz intelligence, and analytics persistence, while the frontend provides role-based workflows for learners and administrators through protected routes and responsive pages.