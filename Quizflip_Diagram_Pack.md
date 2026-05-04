# Quizflip Diagram Pack (Mermaid)

Use these Mermaid blocks to generate diagram images for Chapter 5.

## Fig 5.1 High Level System Architecture

```mermaid
flowchart LR
    A[Learner/Admin Browser] --> B[React Frontend]
    B --> C[Express API Server]
    C --> D[(MongoDB Atlas)]
    C --> E[OpenAI API\nOptional for concept generation]
    F[Render Deployment] --> C
    G[Vercel Deployment] --> B
```

## Fig 5.2 Use Case Diagram

```mermaid
flowchart TB
    L[Learner]
    A[Admin]

    UC1((Register/Login))
    UC2((Select Domain))
    UC3((Study Flashcards))
    UC4((Attend Adaptive Quiz))
    UC5((View Progress and Streak))
    UC6((View Leaderboard))
    UC7((Create Personal Concept Cards))

    UC8((Manage Domains))
    UC9((Generate Cards from PDF/Text))
    UC10((Edit and Save Cards))
    UC11((Configure Card Quiz))
    UC12((View Admin Analytics))

    L --> UC1
    L --> UC2
    L --> UC3
    L --> UC4
    L --> UC5
    L --> UC6
    L --> UC7

    A --> UC1
    A --> UC8
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
```

## Fig 5.3 Class Diagram

```mermaid
classDiagram
    class User {
        +string name
        +string email
        +string password
        +string role
        +number points
    }

    class Domain {
        +string category
        +string name
        +string description
        +number popularityScore
    }

    class Flashcard {
        +ObjectId domainId
        +string concept_title
        +string definition
        +string[] key_points
        +string[] mcqOptions
        +string answer
        +string visibility
    }

    class LearnerProgress {
        +ObjectId learnerId
        +ObjectId domainId
        +number progressPercent
        +number quizzesTaken
        +string[] weakTopics
    }

    class QuizAttempt {
        +ObjectId learnerId
        +ObjectId domainId
        +number score
        +number accuracy
        +string source
    }

    class DailyActivity {
        +ObjectId learnerId
        +string dateKey
        +number questionsSolved
    }

    class LeaderboardSnapshot {
        +string period
        +string key
        +Object[] entries
    }

    User "1" --> "many" Flashcard : createdBy
    Domain "1" --> "many" Flashcard : contains
    User "1" --> "many" LearnerProgress : tracks
    Domain "1" --> "many" LearnerProgress : scope
    User "1" --> "many" QuizAttempt : attempts
    Domain "1" --> "many" QuizAttempt : from
    User "1" --> "many" DailyActivity : logs
```

## Fig 5.4 Sequence Diagram - Learner Quiz Flow

```mermaid
sequenceDiagram
    participant UI as Learner UI
    participant API as Express API
    participant CTRL as Learner Controller
    participant ENG as Adaptive Engine
    participant DB as MongoDB

    UI->>API: POST /learner/quiz/generate
    API->>CTRL: forward request
    CTRL->>DB: fetch progress and cards
    CTRL->>ENG: build adaptive question set
    ENG-->>CTRL: questions
    CTRL-->>UI: quiz payload

    UI->>API: POST /learner/quiz/submit
    API->>CTRL: forward answers
    CTRL->>ENG: evaluate + schedule updates
    ENG->>DB: store attempt, progress, activity
    CTRL-->>UI: score, accuracy, weak topics
```

## Fig 5.5 Activity Diagram - Flashcard Learning

```mermaid
flowchart TD
    S([Start]) --> A[Login]
    A --> B[Select Domain]
    B --> C[Load Flashcards]
    C --> D[View/Flip Card]
    D --> E[Update Progress and Time]
    E --> F{Milestone Reached?}
    F -- No --> D
    F -- Yes --> G[Prompt Quiz]
    G --> H{Take Quiz Now?}
    H -- Yes --> I[Start Quiz]
    H -- No --> D
    I --> J([End Session])
```

## Fig 5.6 DFD Level 0

```mermaid
flowchart LR
    L[Learner] --> P((Quizflip Learning System))
    A[Admin] --> P

    P --> U[(User Store)]
    P --> D[(Domain Store)]
    P --> F[(Flashcard Store)]
    P --> R[(Progress Store)]
    P --> Q[(Quiz Attempt Store)]
    P --> T[(Activity Store)]
    P --> B[(Leaderboard Store)]

    P --> L
    P --> A
```

## Fig 5.7 DFD Level 1

```mermaid
flowchart TB
    E1[Learner/Admin]

    P1((P1 Authenticate User))
    P2((P2 Manage Domains and Cards))
    P3((P3 Track Learning Activity))
    P4((P4 Generate and Evaluate Quiz))
    P5((P5 Update Progress and Weak Topics))
    P6((P6 Produce Analytics and Leaderboard))

    DS1[(Users)]
    DS2[(Domains)]
    DS3[(Flashcards)]
    DS4[(Learner Progress)]
    DS5[(Quiz Attempts)]
    DS6[(Daily Activity)]
    DS7[(Leaderboard)]

    E1 --> P1 --> DS1
    E1 --> P2 --> DS2
    P2 --> DS3
    E1 --> P3 --> DS4
    E1 --> P4 --> DS3
    P4 --> DS5
    P4 --> P5 --> DS4
    P5 --> DS6
    P5 --> P6 --> DS7
    P6 --> E1
```

## Fig 5.8 V Shaped SDLC Model

```mermaid
flowchart TD
    R[Requirements] --> HLD[High Level Design]
    HLD --> LLD[Low Level Design]
    LLD --> C[Coding]

    C --> UT[Unit Testing]
    UT --> IT[Integration Testing]
    IT --> ST[System Testing]
    ST --> AT[Acceptance Testing]

    R -. mapped to .-> AT
    HLD -. mapped to .-> ST
    LLD -. mapped to .-> IT
    C -. mapped to .-> UT
```
