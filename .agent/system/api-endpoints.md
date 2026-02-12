# PROOF API Endpoints

> REST API routes available in the Next.js application.

---

## Authentication

### Wallet Authentication (CIP-30)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallet/nonce` | Generate login nonce for wallet |
| POST | `/api/wallet/login` | Verify signature and create session |
| POST | `/api/wallet/logout` | Invalidate session |

**Request: `/api/wallet/nonce`**
```json
{ "walletAddress": "addr1..." }
```

**Response:**
```json
{ "nonce": "uuid-string" }
```

**Request: `/api/wallet/login`**
```json
{
  "walletAddress": "addr1...",
  "signature": "hex-signature",
  "nonce": "uuid-string"
}
```

**Response:**
```json
{ "success": true, "userId": "uuid" }
```

### Magic Link (Supabase)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/callback` | OAuth callback handler |
| GET | `/auth/sign-out` | Sign out user |

---

## Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | List reviews (paginated) |
| POST | `/api/reviews` | Create new review |
| POST | `/api/reviews/[id]/vote` | Vote on review helpfulness |

**Query Params (GET):**
- `projectId` (required) — Filter by project
- `page` (default: 1)
- `limit` (default: 10)

**Request: POST `/api/reviews`**
```json
{
  "projectId": "uuid",
  "rating": 4,
  "title": "Review title",
  "content": "Review content...",
  "alignmentScore": 4,
  "feasibilityScore": 3,
  "auditabilityScore": 5
}
```

**Request: POST `/api/reviews/[id]/vote`**
```json
{ "value": 1 }  // 1 = helpful, -1 = not helpful
```

---

## Accountability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accountability/person/[id]` | Get person's accountability score |
| GET | `/api/accountability/leaderboard` | Top 100 by accountability score |
| POST | `/api/accountability/recalculate` | Recalculate all scores (admin) |

**Response: `/api/accountability/person/[id]`**
```json
{
  "score": {
    "personId": "uuid",
    "overallScore": 75,
    "completionScore": 80,
    "deliveryScore": 60,
    "communityScore": 70,
    "efficiencyScore": 90,
    "communicationScore": 50,
    "badge": "reliable",
    "calculatedAt": "2026-02-12T00:00:00Z",
    "person": { "id": "uuid", "name": "Person Name" }
  }
}
```

---

## Ratings & Concerns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ratings` | Submit star rating |
| GET | `/api/concerns` | List concerns |
| POST | `/api/concerns` | Submit new concern |
| POST | `/api/concerns/[id]/responses` | Respond to concern |

---

## Reputation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reputation/recalculate` | Recalculate user reputation |

---

## Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/monitoring/etl` | Report ETL job status |
| POST | `/api/monitoring/error` | Report application error |

**Request: `/api/monitoring/etl`**
```json
{
  "job": "github_metrics",
  "status": "error",
  "message": "Rate limit exceeded"
}
```

---

## Rate Limiting

All POST endpoints implement rate limiting:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Reviews | 5 requests | 60 seconds |
| Review Votes | 15 requests | 60 seconds |
| Ratings | 10 requests | 60 seconds |
| Concerns | 3 requests | 60 seconds |

Rate limit is applied per IP address.

---

## Authentication Requirements

| Endpoint | Auth Required |
|----------|---------------|
| GET endpoints | No |
| POST `/api/reviews` | Yes |
| POST `/api/reviews/[id]/vote` | Yes |
| POST `/api/ratings` | Yes |
| POST `/api/concerns` | Yes |
| POST `/api/accountability/recalculate` | Yes |

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12
