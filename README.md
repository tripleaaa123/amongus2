# Among Us IRL

A web app to help facilitate Among Us games in real life.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Create a game with a unique game code
- Join games using the game code
- Host can set the number of imposters
- Real-time game state updates using Firebase Firestore
- Random role assignment when game starts (Crewmate or Imposter)

## How to Use

1. **Create Game**: Click "Create Game", enter your nickname and select number of imposters. Share the game code with friends.
2. **Join Game**: Click "Join Game", enter the game code and your nickname.
3. **Start Game**: The host can adjust the imposter count and click "Start Game" when ready. Each player will see their assigned role.

## Tech Stack

- Next.js 14 (App Router)
- React
- TypeScript
- Firebase Firestore
