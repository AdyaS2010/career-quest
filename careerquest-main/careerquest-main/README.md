# CarQst - Career Exploration Game

CarQst is an interactive career exploration platform built for FBLA Competition. Experience hands-on career simulations through Papa's Pizzeria-style mini-games across five diverse career paths: Culinary Arts, Information Technology, Law & Government, Media & Communication, and Health Sciences.

## 🎮 About the App

CarQst transforms career exploration into an engaging gaming experience. Each career path features three progressively challenging mini-games that simulate real-world job tasks. Students learn about different professions through interactive gameplay while earning scores and tracking their progress.

### Featured Career Paths

- **🍳 Culinary Arts (Chef)** - Order taking, cooking with timers, plate presentation
- **💻 Information Technology (Software Engineer)** - Bug hunting, algorithm building, system design
- **⚖️ Law & Government (Lawyer)** - Evidence sorting, courtroom arguments, cross-examination
- **📰 Media & Communication (Journalist)** - Fact-checking, interviewing, story crafting
- **🏥 Health Sciences (Medical Professional)** - Patient diagnosis, treatment planning, ER triage

## 📁 Project Structure

```
CarQst-main/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AuthModal.tsx     # Authentication modal
│   │   ├── CharacterGuide.tsx
│   │   └── FloatingIsland.tsx
│   ├── contexts/             # React context providers
│   │   └── AuthContext.tsx   # User authentication state
│   ├── games/                # Career game implementations
│   │   ├── CulinaryArts.tsx  # Main culinary game wrapper
│   │   ├── InformationTechnology.tsx
│   │   ├── LawGovernment.tsx
│   │   ├── MediaCommunication.tsx
│   │   ├── HealthSciences.tsx
│   │   ├── culinary/         # Culinary challenge components
│   │   │   ├── CookingChallenge.tsx
│   │   │   ├── OrderTakingChallenge.tsx
│   │   │   └── PlatePresentationChallenge.tsx
│   │   ├── it/               # IT challenge components
│   │   │   ├── BugHuntChallenge.tsx
│   │   │   ├── AlgorithmBuilderChallenge.tsx
│   │   │   └── SystemDesignChallenge.tsx
│   │   ├── law/              # Law challenge components
│   │   │   ├── EvidenceDetectiveChallenge.tsx
│   │   │   ├── CourtroomArgumentsChallenge.tsx
│   │   │   └── CrossExaminationChallenge.tsx
│   │   ├── media/            # Media challenge components
│   │   │   ├── FactCheckChallenge.tsx
│   │   │   ├── InterviewMasterChallenge.tsx
│   │   │   └── StoryCrafterChallenge.tsx
│   │   └── health/           # Health challenge components
│   │       ├── SymptomDetectiveChallenge.tsx
│   │       ├── TreatmentPlannerChallenge.tsx
│   │       └── EmergencyRoomRushChallenge.tsx
│   ├── lib/                  # Utility libraries
│   │   ├── supabase.ts       # Supabase client configuration
│   │   └── database.types.ts # TypeScript database types
│   ├── pages/                # Main application pages
│   │   ├── LandingPage.tsx   # Landing/home page
│   │   ├── HomePage.tsx      # Career selection page
│   │   ├── CareerWorld.tsx   # Career challenge router
│   │   └── ProfilePage.tsx   # User profile and progress
│   ├── App.tsx               # Main app component with routing
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles with Tailwind
├── supabase/
│   └── migrations/           # Database migration 
├── .env                      # Environment variables (Supabase credentials)
├── package.json              # Project dependencies
├── vite.config.ts            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account (for database and authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CarQst-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the migration files in your Supabase SQL Editor in this order:
   - First, run the base schema migration from `supabase/migrations/`
   - Then run each career SQL file:
     - `add-culinary-career.sql`
     - `add-it-career.sql`
     - `add-law-career.sql`
     - `add-media-career.sql`
     - `add-health-career.sql`

### Running the Application

**Development Mode:**
```bash
node node_modules/vite/bin/vite.js
```

The application will start at `http://localhost:5173`

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

## 🎯 Key Features

- **Interactive Mini-Games** - Papa's Pizzeria-style gameplay mechanics
- **Progress Tracking** - Save scores and track completion across careers
- **User Authentication** - Secure login with Supabase Auth
- **Responsive Design** - Optimized for desktop and mobile devices
- **Real-time Scoring** - Immediate feedback and performance metrics
- **Multiple Difficulty Levels** - Beginner, intermediate, and advanced challenges

## 🛠️ Tech Stack

- **Frontend:** React 18.3.1 + TypeScript 5.5.3
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1
- **Backend:** Supabase (PostgreSQL + Auth)
- **Routing:** React Router 7.9.5
- **Icons:** Lucide React

## 📝 Game Design

Each career path follows a consistent structure:
- **Challenge 1:** Beginner difficulty, tutorial-style mechanics
- **Challenge 2:** Intermediate difficulty, introduces complexity
- **Challenge 3:** Advanced difficulty, combines multiple skills

All games feature:
- Clear mission objectives and instructions
- Real-time feedback and scoring
- Star ratings (1-3 stars based on performance)
- Retry functionality to improve scores
- Smooth animations and transitions

## 🎓 Educational Value

CarQst helps students:
- Explore diverse career options through hands-on experience
- Understand daily tasks and challenges in different professions
- Develop decision-making and problem-solving skills
- Learn industry-specific terminology and concepts
- Discover career interests in an engaging, low-pressure environment

## 📄 License

This project is created for FBLA Competition.

## 👥 Contributors

Developed by Team CarQst for FBLA Computer Game & Simulation Programming Competition.

