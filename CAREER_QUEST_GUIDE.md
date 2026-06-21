# Career Quest - Developer Guide

## Overview

Career Quest is an immersive, gamified career exploration platform where users explore floating 3D island worlds representing different career paths. Each world contains interactive scenarios and skill-based challenges that authentically simulate professional experiences.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Icons**: Lucide React
- **Routing**: React Router v6

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.tsx    # Sign in/up modal
│   └── FloatingIsland.tsx # 3D floating island card
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── games/               # Career-specific game implementations
│   ├── CulinaryArts.tsx # Main culinary game wrapper
│   └── culinary/        # Culinary mini-games
│       ├── OrderTakingChallenge.tsx
│       ├── CookingChallenge.tsx
│       └── PlatePresentationChallenge.tsx
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── database.types.ts # TypeScript types for database
├── pages/
│   ├── LandingPage.tsx  # Public landing page
│   ├── HomePage.tsx     # Main career selection page
│   └── CareerWorld.tsx  # Career-specific world view
└── App.tsx              # Root component with routing

```

## Database Schema

### Tables

1. **profiles** - User profiles
   - Linked to Supabase auth.users
   - Stores username, avatar, total score

2. **careers** - Career definitions
   - 5 careers: Culinary Arts, Law & Government, IT, Media & Communication, Health Sciences
   - Each has unique color scheme, icon, description

3. **challenges** - Individual challenges within careers
   - Linked to careers
   - Types: scenario, skill_task, mini_game
   - Contains configuration JSON for game-specific settings

4. **user_career_progress** - User progress per career
   - Tracks status (not_started, in_progress, completed)
   - Stores total score per career

5. **user_challenge_progress** - User progress per challenge
   - Tracks attempts, best score
   - Status: locked, unlocked, in_progress, completed

6. **achievements** - Available achievements
7. **user_achievements** - User's unlocked achievements

## Currently Implemented: Culinary Arts

### Career Overview
The Culinary Arts world teaches players about restaurant management, cooking techniques, and food presentation through three engaging challenges:

### Challenge 1: Order Taking Master
**Type**: Memory & Attention Challenge

Players must:
1. Memorize customer orders (items + special requests)
2. Recall orders accurately from memory
3. Handle multiple tables

**Scoring**: 100 points max
- Based on accuracy of items and special requests
- 3 orders total

### Challenge 2: Perfect Timing Chef
**Type**: Timing & Temperature Challenge

Players must:
1. Cook dishes (steak, salmon, pasta)
2. Stop cooking at the right time
3. Monitor temperature in real-time

**Scoring**: 100 points max
- 50 points for timing accuracy
- 50 points for temperature accuracy

### Challenge 3: Plate Presentation Artist
**Type**: Creative Design Challenge

Players must:
1. Select 6 ingredients
2. Create a balanced plate (protein, veg, starch, garnish)
3. Arrange items artistically

**Scoring**: 100 points max
- Balance across food groups (80 points)
- Item variety (20 points)

## How to Add New Career Worlds

### Step 1: Add Career to Database

```sql
INSERT INTO careers (slug, name, title, description, color_scheme, icon, estimated_time, order_index) VALUES
('your-career-slug', 'Career Name', 'Job Title', 'Description here',
'{"primary": "#HEX", "secondary": "#HEX", "accent": "#HEX", "background": "#HEX"}',
'LucideIconName', 15, 6);
```

### Step 2: Create Challenges

```sql
INSERT INTO challenges (career_id, title, description, order_index, max_score, challenge_type, config)
VALUES
('<career_id>', 'Challenge 1', 'Description', 0, 100, 'scenario', '{"subType": "custom-type"}');
```

### Step 3: Create Game Component

Create `src/games/YourCareer.tsx`:

```typescript
import { useState } from 'react';
import type { Challenge } from '../lib/database.types';

interface YourCareerGameProps {
  challenge: Challenge;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function YourCareerGame({ challenge, onComplete, onExit }: YourCareerGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [score, setScore] = useState(0);

  // Implement your game logic here

  return (
    <div>
      {/* Your game UI */}
    </div>
  );
}
```

### Step 4: Create Mini-Game Challenges

Create subdirectory `src/games/your-career/` with individual challenge components:

```typescript
export function Challenge1({ onComplete }: { onComplete: (score: number) => void }) {
  // Challenge logic
  return <div>{/* Challenge UI */}</div>;
}
```

### Step 5: Update CareerWorld.tsx

Add your career to the game selection:

```typescript
if (selectedChallenge) {
  return (
    <div className="min-h-screen">
      {careerSlug === 'culinary-arts' && <CulinaryArtsGame {...props} />}
      {careerSlug === 'your-career-slug' && <YourCareerGame {...props} />}
    </div>
  );
}
```

## Game Design Guidelines

### 1. Challenge Structure
Each career should have 3-5 challenges that:
- Take 3-5 minutes each to complete
- Test profession-specific skills
- Provide immediate feedback
- Are replayable for better scores

### 2. Scoring System
- Max score: 100 points per challenge
- Award stars: 3 stars (90+), 2 stars (70-89), 1 star (50-69)
- Track best scores, not just recent attempts

### 3. Visual Design
- Use career-specific color schemes
- Include profession-relevant emojis/icons
- Maintain consistent spacing and typography
- Add smooth transitions and animations

### 4. User Experience
- Clear instructions before each challenge
- Progress indicators during gameplay
- Encouraging feedback on completion
- Option to retry or move forward

## Career Templates for Future Implementation

### Law & Government (Lawyer)
**Challenges:**
1. **Case Analysis** - Review evidence and identify key facts
2. **Argument Building** - Construct compelling legal arguments
3. **Cross-Examination** - Question witnesses effectively

### Information Technology (Software Engineer)
**Challenges:**
1. **Bug Detective** - Find and fix code errors
2. **Algorithm Design** - Solve programming puzzles
3. **System Architecture** - Design scalable solutions

### Media & Communication (Journalist)
**Challenges:**
1. **Fact Checking** - Verify information accuracy
2. **Interview Skills** - Ask probing questions
3. **Story Writing** - Craft compelling narratives

### Health Sciences (Medical Professional)
**Challenges:**
1. **Symptom Diagnosis** - Identify health conditions
2. **Treatment Planning** - Recommend appropriate care
3. **Emergency Response** - Handle critical situations

## Color Schemes

Each career uses a unique color palette:

- **Culinary Arts**: Orange/Red (warm, energetic)
- **Law & Government**: Blue (trustworthy, professional)
- **IT**: Green (innovative, growth)
- **Media**: Purple (creative, dynamic)
- **Health**: Red/Pink (caring, vital)

## Authentication Flow

1. User visits landing page at `/welcome`
2. Clicks "Get Started" or "Sign In"
3. Completes authentication in modal
4. Profile automatically created in database
5. Redirects to home page with career islands
6. Progress tracked automatically per user

## Progress Tracking

- **Automatic**: Progress saved after each challenge completion
- **Best Scores**: System keeps highest score per challenge
- **Unlock System**: Challenges unlock sequentially
- **Career Completion**: All challenges must be completed

## Responsive Design

The application is fully responsive:
- **Mobile**: Single column, touch-friendly
- **Tablet**: Two columns, optimized spacing
- **Desktop**: Three columns, full features

## Performance Optimizations

- Lazy loading of game components
- Optimized database queries
- Efficient state management
- Minimal re-renders

## Future Enhancements

### Phase 2
- Leaderboards
- Social sharing
- Achievement system
- Career recommendations based on performance

### Phase 3
- Multiplayer challenges
- Career mentors (AI/real)
- Extended career library
- Mobile apps (iOS/Android)

### Phase 4
- VR/AR experiences
- Real-world job connections
- Educational partnerships
- Career counseling integration

## Development Tips

1. **Test on Multiple Devices**: Always check mobile responsiveness
2. **Use TypeScript**: Leverage types for safer development
3. **Follow Patterns**: Match existing code structure
4. **Optimize Images**: Keep assets small and fast
5. **Progressive Enhancement**: Core features work without JS

## Deployment

The app is configured for deployment on modern hosting platforms:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any static host with SPA support

Environment variables needed:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support & Contribution

This is a production-ready foundation that can be extended with additional careers and features. The modular architecture makes it easy to add new content while maintaining code quality and user experience.

---

**Built with passion for career exploration and gamified learning!**
