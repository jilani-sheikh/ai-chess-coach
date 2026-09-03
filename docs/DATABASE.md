# AI Chess Coach — Database Design

## 1. Database

The application will use:

* **PostgreSQL** — relational database
* **Neon** — serverless PostgreSQL hosting
* **Prisma** — ORM and database schema management

---

## 2. Database Design Principles

The database should:

1. Store the user's chess data reliably.
2. Keep games and analysis separate where appropriate.
3. Avoid unnecessary tables during the MVP.
4. Support future personalization.
5. Support RAG and vector search later.
6. Maintain clear relationships between entities.
7. Keep the schema easy to understand and modify.

---

## 3. Planned Core Entities

The application will eventually require entities such as:

```text
User
 │
 ├── Games
 │     └── Game Analysis
 │
 ├── Training Sessions
 │     └── Training Attempts
 │
 └── Player Statistics

Chess Knowledge
 │
 └── Knowledge Chunks
       └── Embeddings
```

---

## 4. Initial Entities

### User

Represents an application user.

Potential fields:

* id
* name
* email
* password/authentication information
* createdAt
* updatedAt

Authentication-related fields will be finalized when Auth.js is implemented.

---

### Game

Represents a chess game uploaded or imported by the user.

Potential fields:

* id
* userId
* PGN
* white player
* black player
* result
* opening information
* playedAt
* createdAt

Relationship:

```text
User 1 ──────── N Game
```

---

### Game Analysis

Stores the results generated from analyzing a game.

Potential information:

* Stockfish evaluation
* move classifications
* important mistakes
* blunders
* inaccuracies
* best moves
* analysis metadata

Relationship:

```text
Game 1 ──────── 1/N GameAnalysis
```

The exact structure will be finalized after implementing Stockfish.

---

### Training Session

Represents a training activity performed by the user.

Potential information:

* session type
* difficulty
* start time
* completion time
* score

Relationship:

```text
User 1 ──────── N TrainingSession
```

---

### Training Attempt

Represents an individual attempt within a training session.

Potential information:

* puzzle
* user's answer
* result
* time taken
* createdAt

Relationship:

```text
TrainingSession 1 ──────── N TrainingAttempt
```

---

## 5. RAG / Knowledge Entities

These entities will be introduced when RAG is implemented.

### Knowledge Source

Represents a source of chess knowledge.

Examples:

* Chess principles
* Opening theory
* Tactical concepts
* Endgame concepts
* Strategic concepts
* Curated educational material

---

### Knowledge Chunk

A document is divided into smaller chunks for retrieval.

Potential fields:

* id
* sourceId
* content
* metadata
* createdAt

---

### Embedding

Represents the vector representation of a knowledge chunk.

The project is planned to use:

**PostgreSQL + pgvector**

for vector similarity search.

The exact implementation will be decided when the RAG pipeline is built.

---

## 6. Important Relationships

Initial relationship model:

```text
User
 │
 ├──< Game
 │      │
 │      └──< GameAnalysis
 │
 ├──< TrainingSession
 │      │
 │      └──< TrainingAttempt
 │
 └── Player Statistics

KnowledgeSource
 │
 └──< KnowledgeChunk
         │
         └── Embedding
```

---

## 7. MVP Database Strategy

We will NOT create every planned table immediately.

The initial database should contain only what is required to make the first working version.

Initial priority:

```text
User
Game
GameAnalysis
```

Training and RAG-related tables will be introduced when those features are implemented.

---

## 8. Schema Decision Log

Important database decisions should be recorded here.

### Initial Decision

Use:

```text
PostgreSQL + Neon + Prisma
```

Reason:

* PostgreSQL provides relational data modeling.
* Neon provides managed/serverless PostgreSQL hosting.
* Prisma provides a developer-friendly ORM and schema management.
* PostgreSQL can later support vector search through pgvector.

### Important Rule

Do not make major schema changes without updating this document.
