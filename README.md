# ♟️ Personalised AI Chess Coach

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stockfish-18-teal?style=for-the-badge&logo=chess.com" alt="Stockfish" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
</p>

**AI Chess Coach** is a personalized chess improvement platform that analyzes your own games using **Stockfish 18**, identifies recurring weaknesses, generates targeted training exercises directly from your mistakes, and leverages **Google Gemini** to deliver simple, human-like coaching explanations.

> **Analyze your games. Understand your mistakes. Train smarter. Improve your chess.**

---

## 🚀 Live Demo

* 🔗 **Live Application:** [AI Chess Coach](https://ai-chess-coach-plum.vercel.app)
* 🔗 **GitHub Repository:** [AI Chess Coach](https://github.com/jilani-sheikh/ai-chess-coach)

> Explore the app by signing in, uploading your Chess.com or Lichess PGN files, analyzing games move-by-move, and starting personalized training drills.

---

## ✨ Why This Project?

Most chess platforms offer generic puzzles and algorithmic engine lines that are difficult to interpret. **AI Chess Coach** focuses on the player's **actual games and recurring mistakes**.

Instead of solving disconnected puzzles, the application:

1. **Parses & Analyzes:** Ingests your uploaded PGN games using Stockfish 18.
2. **Detects Flaws:** Flags mistakes, inaccuracies, and game-losing blunders.
3. **Finds Patterns:** Discovers recurring tactical and positional weaknesses across games.
4. **Generates Drills:** Creates targeted training positions directly from your own blunders.
5. **Validates Responses:** Evaluates alternate user moves in real-time with the engine.
6. **AI Coaching:** Uses Google Gemini to explain concepts and strategic ideas in natural language.

---

## 🎯 Core Features

### 🔐 Authentication & Game Management
* **Secure Authentication:** Built using Auth.js with protected routes and session handling.
* **PGN Import:** Easily upload and parse PGN game files directly from Chess.com or Lichess.
* **Game Library:** Browse, search, filter, inspect, and manage your uploaded games.

### ♟️ Interactive Chess Experience
* **Dynamic Chessboard:** Smooth replay, move-by-move navigation, and board flipping.
* **Visual Evaluation:** Dynamic evaluation bar (CPL / Mate score) and interactive game graph.
* **Move Classification:** Categorizes moves into *Best*, *Excellent*, *Good*, *Inaccuracy*, *Mistake*, and *Blunder*.

### ⚙️ Stockfish 18 Engine Analysis
* **Deep Engine Evaluation:** Multi-depth position evaluation and best-move calculations.
* **Accuracy Scoring:** Centipawn loss (CPL) calculations and comprehensive game accuracy scores.

### 📊 Personalized Chess Profile
* Identifies recurring tactical blind spots and phase-specific weaknesses (Opening, Middlegame, Endgame).
* Tracks performance trends and accuracy growth over time.

### 🏋️ Targeted Training Exercises
* Generates interactive puzzle sequences extracted directly from your blunders.
* Compares your alternate solutions with Stockfish recommendations.
* Instant feedback with conversational AI hints when you get stuck.

---

## 🤖 Dual-Engine Architecture: Stockfish + Google Gemini

The platform cleanly separates objective chess calculations from conversational explanations:

| Component | Role | Responsibilities |
| :--- | :--- | :--- |
| **Stockfish 18** | **Source of Truth** | Position evaluation, CPL calculation, best moves, and move validation |
| **Google Gemini** | **Coaching Layer** | Translates engine output into plain English, explains tactical motifs & principles |

### 🛡️ How Hallucination Is Prevented

Large Language Models frequently hallucinate illegal chess moves or faulty evaluations. AI Chess Coach solves this with a **controlled data pipeline**:

> **Stockfish calculates the chess facts. Gemini explains those facts.**

Gemini is never asked to calculate positions or validate moves independently. All evaluations and variations are pre-computed by Stockfish and supplied to Gemini as structured context.

```text
   ┌───────────────┐
   │   User Game   │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │  PGN Parsing  │
   └───────┬───────┘
           │
           ▼
   ┌───────────────────────┐
   │  Stockfish 18 Engine  │
   │  (Facts & Evaluations)│
   └───────┬───────────────┘
           │
           ▼
   ┌───────────────────────┐
   │ Structured Chess Data │
   └───────┬───────────────┘
           │
           ▼
   ┌───────────────────────┐
   │ Google Gemini Coach   │
   │ (Natural Explanations)│
   └───────┬───────────────┘
           │
           ▼
   ┌───────────────────────────┐
   │ Personalized User Feedback│
   └───────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [react-chessboard](https://github.com/Clariity/react-chessboard), [Lucide React](https://lucide.dev/) |
| **Backend & Database** | Next.js Server Actions, [Auth.js (NextAuth v4)](https://authjs.dev/), [Prisma ORM 7](https://www.prisma.io/), [PostgreSQL (Neon)](https://neon.tech/) |
| **Chess Engine & AI** | [chess.js](https://github.com/jhlywa/chess.js), [Stockfish 18](https://stockfishchess.org/), [Google Gemini API](https://ai.google.dev/) |

---

## ⚙️ Getting Started Locally

### Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v20 or higher recommended)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
* PostgreSQL database instance (local or hosted like [Neon](https://neon.tech))

### 1. Clone the Repository
```bash
git clone https://github.com/jilani-sheikh/ai-chess-coach.git
cd ai-chess-coach
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.sample`:
```bash
cp .env.sample .env
```

Fill in the required values:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="your-generated-auth-secret"

# Optional Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# AI Coach
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Push Database Schema
Sync the Prisma schema with your database:
```bash
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.