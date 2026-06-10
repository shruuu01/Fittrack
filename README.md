# FitTrack: AI-Powered Fitness Tracking & Recommendation System

FitTrack is a full-stack, AI-powered health and fitness ecosystem designed to track daily calorie budgets, analyze exercise posture in real-time, recognize food plates from images, recommend personalized regimes, and support social interactions.

---

## Technical Architecture

- **Backend**: Python (Django REST Framework)
  - Native loading and execution of TensorFlow food classification and Scikit-Learn recommendation engines.
  - SQLite (Local Dev) / PostgreSQL (Production) ORM migrations.
  - JWT Stateless Authentication (`simplejwt`).
- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
  - Responsive, mobile-first design featuring a Collapsible Sidebar (Desktop) and Quick Action Bottom Navigation bar (Mobile).
  - Client-side MediaPipe Pose Web SDK frame overlays.
  - Recharts macro pie charts and energy trend graphs.
- **AI/ML**:
  - **OpenCV Color Classification**: Processes BGR average channels and HSV parameters of uploaded food photos to identify Avocado, Salad, Pizza, Oats, Banana, Chicken, or Salmon, returning exact macros and portions.
  - **Scikit-Learn K-Nearest Neighbors (KNN)**: Classifies user profile vectors (age, height, weight, activity score) to output target workout routines and diet recipes.
  - **MediaPipe Pose Real-time Estimation**: Connects to the user's webcam, extracts skeletal coordinate nodes, calculates joint angles (knee flexion for squats, elbow buckling for pushups), and displays visual/text alerts for posture correction.

---

## Folder Structure

```text
fittrack/
├── docker-compose.yml
├── README.md
├── fittrack-backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── fittrack/          # Django settings & routing
│   └── api/               # Database models, serializers, views, and ML models
└── fittrack-frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── next.config.ts
    ├── Dockerfile
    └── src/               # React components, custom hooks, and pages layout
```

---

## Local Development Setup

### Prerequisite
Make sure you have Node.js 18+ and Python 3.10+ installed on your system.

### 1. Backend Setup
1. Open a terminal and navigate to `fittrack-backend`:
   ```bash
   cd fittrack-backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and create a superuser for administrative access:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```
5. Start the local API server:
   ```bash
   python manage.py runserver
   ```
   *The API will be available at `http://localhost:8000`. Access documentation at `http://localhost:8000/api/docs/swagger/`.*

### 2. Frontend Setup
1. Open a separate terminal and navigate to `fittrack-frontend`:
   ```bash
   cd fittrack-frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
   *The web application will be available at `http://localhost:3000`.*

---

## Docker Compose Setup (PostgreSQL Database)

To spin up the entire platform in containers orchestrating PostgreSQL, the Django API, and the Next.js frontend:

1. Open your terminal at the root project directory `fittrack`.
2. Spin up containers:
   ```bash
   docker-compose up --build
   ```
3. The database will bootstrap on port `5432`, backend APIs on port `8000`, and frontend pages on port `3000`.

---

## Features Walkthrough

1. **Authentication**: Sign up at `/register` and login at `/login`. Auth is preserved via JWT.
2. **Dashboard**: Track daily remaining calorie budgets, update water logs, view weekly Recharts intake trends, and check consistency streaks.
3. **Plate Image Scanner**: Navigate to `/food`. Upload a photo of a food item. The OpenCV ML heuristic estimates food item identity and macronutrient distributions (Protein, Carbs, Fat) dynamically.
4. **Workout Tracker**: Select from Exercise categories, input training durations, and the Met calorie calculator will auto-estimate energy expenditure.
5. **Real-time Posture AI**: Navigate to `/posture`. Select "Squat Depth" or "Pushup". Enable your webcam and click "Start Session". Move in frame to view skeletal joint tracking. Complete repetitions, check warnings ("Go lower", "straighten back"), and view saved performance histories.
6. **Social Fitness Hub**: Add friends from the recommendations list, write status updates with photo attachments, and write comments.
7. **Admin moderation Panel**: Navigate to `/admin` to resolve flagged reports, manage user roles, and monitor dashboard analytics.
