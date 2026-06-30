# 🏙️ Questford - Career Quest
**FBLA Computer Game & Simulation Programming (2025-2026)**
* LASA High School (TX)
* Presenters: Adya Sastry, Anika Mehta, Priyanka Dhulipalla

Questford is an interactive, browser-based 16-bit RPG career exploration sandbox platform. Instead of answering static, text-heavy multiple-choice questionnaires, players explore a living retro town, step into professional environments (hospitals, courtrooms, kitchens, tech centers), roleplay as professionals, and complete interactive challenges mapped directly to real-world skill competencies.

---

## 🎮 Game Architecture & Core Loop
Questford features a multi-tiered gameplay loop that connects self-discovery, active training, and performance tracking:

1. **The Core Exploration**: Walk around the city plaza using WASD/touch D-Pad controls. Interact with Mayor Questopher for career tips, or enter district buildings to take on shifts.
2. **Interactive Career Shifts**: Step into 8 distinct career tracks containing 24+ unique mini-games (e.g. triaging patient symptoms in Health Sciences, debugging code in IT, cross-examining witnesses in Law).
3. **Cottage Noir (Player Home)**: Customize your avatar, purchase speed/energy upgrades at the Mirror & Console shop, and play cozy skill-building home mini-games (Memory Match, Speed Sort, Word Scramble) capped by daily cooldowns.
4. **NACE Standard Integration**: Progress translates into a standardized **Career Transcript & Report Card** aligned with the 8 NACE career readiness standards, exportable directly to PDF.

---

## 📁 Directory Structure & File Orientation
```
careerquest-main/
├── public/
│   └── assets/
│       ├── cottage/            # 16-bit indoor furniture sprite sheets
│       ├── landmarks/          # Unique vector/pixel art district building facades
│       └── pico8/              # PICO-8 tilemap configuration & sprite assets
├── src/
│   ├── components/             # Global layout & UI widgets
│   │   ├── DialogueBox.tsx     # High-fidelity narrative dialogue bubble
│   │   ├── IntroScreen.tsx     # Animated splash title screens
│   │   └── SettingsModal.tsx   # Inclusive accessibility toggles
│   ├── contexts/               # Global React states
│   │   ├── AuthContext.tsx     # Supabase Session & Guest-Play handling
│   │   └── ThemeContext.tsx    # Appearance, audio, and accessibility settings
│   ├── games/                  # Custom 24+ career simulation mini-games
│   │   ├── CulinaryArts.tsx    # Order taking, temperature timers, plating
│   │   ├── InformationTechnology.tsx # Syntax debugging, algorithms, logic blocks
│   │   ├── LawGovernment.tsx   # Evidence mapping, courthouse arguments, cross-exam
│   │   ├── MediaCommunication.tsx # Fact-checking, interviewing, storyboard layout
│   │   └── HealthSciences.tsx  # Patient triage, stethoscope diagnostic, ER rush
│   ├── lib/                    # Configuration & state synchronizers
│   │   ├── database.types.ts   # Database schemas
│   │   ├── supabase.ts         # Supabase connection client
│   │   └── wallet.ts           # State/coin balance, purchases, and local storage
│   ├── pages/                  # Main scene pages
│   │   ├── CityHub.tsx         # The main 2D outer city map (custom canvas engine)
│   │   ├── DomainWorld.tsx     # District-specific walkable 2D maps
│   │   ├── AmenityInterior.tsx # Inside maps (Cottage Noir home, vanity shop)
│   │   ├── LeaderboardPage.tsx # Supabase-synced global rankings
│   │   ├── ProfilePage.tsx     # User progress dossier & NACE Career Report
│   │   ├── HowToPlayPage.tsx   # Instruction guides & coin economy overview
│   │   └── city/               # Game layout database & metadata definitions
│   │       ├── CottageGames.tsx # Bookshelf/TV/Desk mini-games in Cottage Noir
│   │       ├── cityLayout.ts   # Bounding boxes, district coords, gates
│   │       ├── pico8.ts        # Custom 2D HTML5 canvas rendering engine loop
│   │       ├── quiz.ts         # Career Compass match quiz logic
│   │       └── story.ts        # Mayoral dialogue scripting engine
│   ├── App.tsx                 # Routing, page transitions, and provider layout
│   └── main.tsx                # Entry point
├── vite.config.ts              # Vite config with offline PWA Workbox settings
└── tailwind.config.js          # Styling configurations
```

---

## 🛠️ The Technology Stack
*   **Core Logic**: React (v18.3) with TypeScript (v5.5) for type-safe scalability.
*   **Build Tooling**: Vite for fast bundling and sub-second hot reloading.
*   **Custom Graphics Renderer**: Written directly on HTML5 Canvas using delta-time physics and pixel-perfect coordinate scaling, ensuring high framerate performance on Chromebooks.
*   **Backend & Security**: Supabase Auth (safe login, guest sessions) and PostgreSQL protected by strict **Row-Level Security (RLS)**.
*   **Progressive Web App (PWA)**: Offline caching via Workbox Service Workers, fully installable on mobile/desktop.
*   **A11y Features**: OpenDyslexic typeface, Speech Synthesis Screen Narrator, and high-contrast color scheme switches.

---

## 🎨 Professional Credits & Acknowledgements
We are committed to creative integrity, professional standards, and proper licensing:
1.  **Artwork & Sprites**: All outer map tiles, interior flooring, and furniture models are licensed under Creative Commons Zero (CC0) from the **Kenney Roguelike Assets Library** (Kenney Pico-8 City & Roguelike Indoor).
2.  **Labor & Market Statistics**: Career descriptions, salary values, and growth indicators are fetched and compiled directly from the **U.S. Bureau of Labor Statistics (BLS)** Occupational Outlook Handbook.
3.  **Career Readiness Framework**: Standard competency scoring matrices are aligned with the **National Association of Colleges and Employers (NACE)** guidelines.
4.  **Academic References**: Statistics regarding student career uncertainty and pivot rates are sourced from the **YouScience Post-Graduation Readiness Report**.

---

## 🚀 Getting Started

### Installation
1.  **Clone and enter directory:**
    ```bash
    git clone https://github.com/AdyaS2010/career-quest.git
    cd career-quest
    ```
2.  **Install project dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Keys:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Launch the development server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` to play!

5.  **Build for Production:**
    ```bash
    npm run build
    ```
