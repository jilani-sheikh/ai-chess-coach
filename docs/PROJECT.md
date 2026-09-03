# AI Chess Coach — Project Specification

## 1. Project Overview

AI Chess Coach is a web application that helps chess players improve by analyzing their games, identifying mistakes and recurring weaknesses, explaining chess concepts, and providing personalized training.

The core idea is:

**Play → Analyze → Understand → Coach → Practice → Improve → Repeat**

The application combines:

* Chess engine analysis using Stockfish
* Chess rules and game-state processing
* LLM-based explanations
* Chess knowledge retrieval using RAG
* Personalized player insights
* Training and practice

The goal is to build a practical, recruiter-facing full-stack AI application rather than a simple chatbot.

---

## 2. Core Product Concept

There is **one AI Chess Coach** in the application.

The AI Chess Coach is responsible for:

1. Understanding the player's analyzed games
2. Explaining mistakes in simple language
3. Identifying recurring weaknesses
4. Answering chess-related questions
5. Using retrieved chess knowledge when appropriate
6. Recommending training based on weaknesses
7. Helping the player improve over time

The application should NOT contain multiple disconnected AI coaches.

---

## 3. Application Pages

The application will initially contain **8 pages**.

### 1. Landing Page

Route:

`/`

Purpose:

* Introduce the application
* Explain the AI Chess Coach
* Show major features
* Provide Login / Signup actions

---

### 2. Authentication

Route:

`/auth`

Purpose:

* Login
* Signup
* Authentication handling

Login and Signup will be handled on the same page rather than creating separate routes.

---

### 3. Dashboard

Route:

`/dashboard`

Purpose:

* Overview of the player's chess activity
* Recently analyzed games
* Basic performance statistics
* Identified weaknesses
* Training recommendations
* Improvement overview

The dashboard should provide a quick summary rather than duplicate the full functionality of other pages.

---

### 4. Games

Route:

`/games`

Purpose:

* Display user's chess games
* Upload PGN
* Paste PGN
* View previously stored games
* Search/filter games

Game import/upload should use a modal/dialog rather than a separate page.

---

### 5. Game Analysis

Route:

`/games/[id]`

Purpose:

Analyze an individual chess game.

Features:

* Interactive chessboard
* Move list
* Current position
* Stockfish evaluation
* Evaluation graph
* Move classification
* Mistakes
* Inaccuracies
* Blunders
* Best moves
* AI explanation of important mistakes
* Ask questions about the current game

There should not be separate pages for Stockfish analysis or mistake explanations.

---

### 6. AI Chess Coach

Route:

`/coach`

Purpose:

This is the application's dedicated AI Coach interface.

The coach can:

* Discuss the player's games
* Explain chess concepts
* Explain recurring mistakes
* Answer chess questions
* Use player history when appropriate
* Retrieve relevant chess knowledge using RAG
* Recommend areas to practice

This is the **only dedicated AI Coach** in the application.

---

### 7. Training

Route:

`/training`

Purpose:

Provide a dedicated environment for chess practice.

Possible features:

* Chess puzzles
* Tactical exercises
* Training sessions
* Recommended exercises
* Weakness-based practice
* Training history
* Adaptive difficulty

Training should remain a separate page from the AI Coach.

The AI Coach may recommend training, but the actual practice happens inside `/training`.

---

### 8. Profile

Route:

`/profile`

Purpose:

* User information
* Chess-related preferences
* Account settings
* Player statistics
* Training preferences

---

## 4. Core Architecture

The application follows this high-level flow:

```text
User
  │
  ▼
Next.js Application
  │
  ├── Authentication
  │
  ├── Games
  │     │
  │     ▼
  │   PostgreSQL
  │
  ├── Game Analysis
  │     │
  │     ├── chess.js
  │     └── Stockfish
  │
  ├── AI Chess Coach
  │     │
  │     ├── LLM
  │     ├── Player/Game Data
  │     └── RAG
  │            │
  │            └── PostgreSQL + pgvector
  │
  └── Training
        │
        └── Puzzles / Practice
```

---

## 5. Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Next.js server-side functionality
* API routes / server actions where appropriate

### Database

* PostgreSQL
* Neon

### ORM

* Prisma

### Chess

* chess.js
* react-chessboard
* Stockfish

### AI

* Large Language Model
* Embedding model
* RAG pipeline

### Vector Search

* PostgreSQL
* pgvector

### Authentication

* Auth.js

### Deployment

* Vercel
* Neon PostgreSQL

---

## 6. Responsibilities of Each AI Component

### Stockfish

Stockfish is responsible for objective chess analysis.

It determines things such as:

* Position evaluation
* Best moves
* Evaluation changes
* Tactical mistakes
* Blunders
* Inaccuracies

Stockfish does NOT provide natural-language coaching.

---

### RAG

RAG is responsible for retrieving relevant chess knowledge.

Possible knowledge sources include:

* Chess concepts
* Opening principles
* Tactical patterns
* Endgame concepts
* Strategic principles
* Training material
* Curated chess knowledge

RAG provides relevant context to the LLM.

---

### LLM

The LLM is responsible for:

* Explaining Stockfish results
* Explaining chess concepts
* Connecting mistakes to chess principles
* Answering player questions
* Generating personalized coaching responses
* Providing training recommendations

The LLM should not replace Stockfish for objective engine evaluation.

---

## 7. Database Direction

The primary database will be:

**PostgreSQL hosted on Neon**

Prisma will be used as the ORM.

The database will eventually contain entities such as:

* User
* Game
* Move
* GameAnalysis
* PlayerStats
* TrainingSession
* Puzzle
* TrainingAttempt
* KnowledgeChunk
* Embedding

The exact schema will be designed separately in `docs/DATABASE.md`.

Do not create the complete database schema until the requirements have been finalized.

---

## 8. RAG Pipeline

The planned RAG architecture is:

```text
Chess Knowledge
      │
      ▼
Document Processing
      │
      ▼
Chunking
      │
      ▼
Embedding Model
      │
      ▼
Vector Embeddings
      │
      ▼
PostgreSQL + pgvector
      │
      ▼
User Question
      │
      ▼
Query Embedding
      │
      ▼
Similarity Search
      │
      ▼
Relevant Chess Knowledge
      │
      ▼
LLM
      │
      ▼
AI Coach Response
```

RAG should be introduced after the basic application and game-analysis pipeline are working.

---

## 9. Development Phases

### Phase 1 — Foundation

* Next.js setup
* Project structure
* Tailwind
* shadcn/ui
* Authentication foundation
* PostgreSQL
* Neon
* Prisma
* Basic database schema

### Phase 2 — Games

* PGN upload
* PGN parsing
* Game storage
* Games page
* Game details

### Phase 3 — Chess Analysis

* Chessboard
* Move navigation
* chess.js integration
* Stockfish integration
* Evaluation
* Move classification
* Evaluation graph

### Phase 4 — AI Coach

* LLM integration
* Game context
* Mistake explanations
* Coach interface

### Phase 5 — RAG

* Chess knowledge collection
* Document processing
* Chunking
* Embeddings
* pgvector
* Similarity search
* RAG + LLM integration

### Phase 6 — Personalization

* Analyze multiple games
* Detect recurring weaknesses
* Player-level insights
* Personalized recommendations

### Phase 7 — Training

* Training page
* Puzzle system
* Recommended exercises
* Training attempts
* Training history

### Phase 8 — Polish & Deployment

* UI refinement
* Error handling
* Loading states
* Security
* Performance
* Testing
* Vercel deployment
* Production database

---

## 10. Core User Journey

The primary user journey is:

```text
Create Account
      ↓
Upload Chess Game
      ↓
Game Stored
      ↓
Analyze Game
      ↓
Stockfish Analysis
      ↓
Identify Mistakes
      ↓
AI Explains Mistakes
      ↓
Player Discusses With Coach
      ↓
Weaknesses Identified
      ↓
Training Recommended
      ↓
Player Practices
      ↓
New Games Analyzed
      ↓
Progress Improves
```

---

## 11. Scope Rules

The following rules should be followed during development:

1. Do not create unnecessary pages.
2. Keep one AI Chess Coach.
3. Keep Training as a separate page.
4. Do not build RAG before the basic game-analysis pipeline works.
5. Do not over-engineer the initial database schema.
6. Prefer simple solutions when they satisfy the requirement.
7. New features should have a clear purpose in the core product.
8. Avoid adding technologies without a concrete requirement.
9. Maintain documentation when important architectural decisions change.
10. The project should remain realistic to complete within the available development time.

---

## 12. Success Criteria

The project should ultimately allow a user to:

* Create an account
* Upload a chess game
* View the game
* Analyze the game using Stockfish
* Understand important mistakes through AI explanations
* Ask the AI Chess Coach questions
* Receive personalized insights
* Retrieve relevant chess knowledge through RAG
* Practice weaknesses through Training
* Track improvement over multiple games

The final application should demonstrate:

**Full-stack development + databases + chess algorithms + AI/LLMs + RAG + personalization + production deployment.**
