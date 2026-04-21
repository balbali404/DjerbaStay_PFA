# DjerbaStay Prisma ERD

This ERD reflects the schema defined in `DjerbaStay-Backend/prisma/schema.prisma`.

```mermaid
erDiagram
    SubscriptionPlan ||--o{ User : assigns
    User ||--o{ RefreshToken : owns
    User ||--o{ MonthlyUsage : tracks
    User ||--o{ PlannerRequest : submits
    Accommodation ||--o{ PlannerRequest : selected_for

    SubscriptionPlan {
      string id PK
      enum code UK
      string name
      string description
      int monthlyMlRequests
      float monthlyPriceUsd
      json features
      datetime createdAt
      datetime updatedAt
    }

    User {
      string id PK
      string fullName
      string email UK
      string passwordHash
      string planId FK
      datetime createdAt
      datetime updatedAt
    }

    RefreshToken {
      string id PK
      string userId FK
      string tokenHash UK
      datetime expiresAt
      datetime revokedAt
      datetime createdAt
    }

    MonthlyUsage {
      string id PK
      string userId FK
      datetime monthStart
      int mlRequests
      datetime createdAt
      datetime updatedAt
    }

    Accommodation {
      string id PK
      int externalId UK
      string name
      string type
      string area
      string imageFileName
      float latitude
      float longitude
      float rating
      datetime createdAt
      datetime updatedAt
    }

    Place {
      string id PK
      int externalId UK
      string name
      string type
      string category
      string imageFileName
      float latitude
      float longitude
      float rating
      float durationHours
      float price
      string tags
      string travelType
      datetime createdAt
      datetime updatedAt
    }

    Restaurant {
      string id PK
      int externalId UK
      string name
      string imageFileName
      float latitude
      float longitude
      float rating
      float price
      string tags
      string travelType
      datetime createdAt
      datetime updatedAt
    }

    TravelerProfile {
      string id PK
      string personality UK
      string keywords
      string imageFileName
      datetime createdAt
      datetime updatedAt
    }

    Synonym {
      string id PK
      string term UK
      string expansion
      datetime createdAt
      datetime updatedAt
    }

    TripBudgetSample {
      string id PK
      int externalRowId UK
      int days
      int persons
      int budgetLevel
      enum transport
      float totalActivities
      float totalFood
      float totalTransport
      float totalCost
      datetime createdAt
      datetime updatedAt
    }

    PlannerRequest {
      string id PK
      string userId FK
      string accommodationId FK
      string interests
      int days
      int persons
      int budgetLevel
      enum transport
      json tripPlan
      json budgetBreakdown
      int flaskPlanStatus
      int flaskBudgetStatus
      datetime createdAt
    }
```

## Notes

- `FREE`, `PLUS`, and `PREMIUM` are stored in `SubscriptionPlan.code`.
- Monthly AI usage limits are enforced from `SubscriptionPlan.monthlyMlRequests`.
- Planner outputs from Flask (`tripPlan` and `budgetBreakdown`) are persisted in `PlannerRequest`.
- All AI CSV data from `DjerbaStay-Ai/data` is imported via `DjerbaStay-Backend/prisma/seed.ts`.
