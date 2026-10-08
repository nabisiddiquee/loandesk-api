# LoanDesk API

A REST API for MSME loan applications: a business applies, an analyst reviews, and an admin disburses. Every status change is checked against a workflow, recorded in an audit trail, and protected by role-based access.

Built with **NestJS, TypeScript, Prisma ORM and PostgreSQL**.

## Features

- **JWT authentication** with bcrypt-hashed passwords
- **Role-based access** (`APPLICANT`, `ANALYST`, `ADMIN`) using a custom `@Roles()` decorator and guard
- **Loan workflow engine**: `SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED → DISBURSED`, with illegal jumps rejected
- **Audit trail**: every status change is stored as a `LoanEvent` (who, from, to, note, when)
- **Optimistic concurrency**: two analysts cannot overwrite each other's decision
- **EMI calculator** with a full month-by-month amortization schedule
- **Input validation** with `class-validator` (GSTIN format, amount and tenure limits)
- **Pagination and filtering** on loan lists; applicants only see their own loans
- **Portfolio summary** grouped by status (count and total amount)
- **Swagger / OpenAPI docs** at `/docs`
- **Unit tests** with Jest, **Docker** and docker-compose setup

## Tech stack

| Layer | Tools |
|---|---|
| Framework | NestJS 10, TypeScript |
| Database | PostgreSQL 16, Prisma ORM 7 (driver adapter `@prisma/adapter-pg`) |
| Auth | Passport JWT, bcrypt |
| Docs | Swagger (OpenAPI 3) |
| Testing | Jest, ts-jest |
| DevOps | Docker, docker-compose |

## Project structure

```
src/
  auth/      register, login, JWT strategy
  common/    @Roles decorator, RolesGuard, @CurrentUser
  loans/     controller, service, DTOs, workflow rules, EMI maths, tests
  prisma/    PrismaService (global module)
prisma/
  schema.prisma        User, Loan, LoanEvent models
  migrations/          SQL migrations
  seed.ts              demo users
```

## Run locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma migrate deploy     # create tables
npm run seed                  # demo users, password: Password@123
npm run start:dev
```

API: `http://localhost:3000/api` · Swagger: `http://localhost:3000/docs`

### With Docker

```bash
docker compose up --build
docker compose exec api npx prisma migrate deploy
```

## API overview

| Method | Endpoint | Who | What |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an applicant account |
| POST | `/api/auth/login` | public | Get a JWT |
| GET | `/api/loans/emi-calculator?amount=&annualRate=&tenureMonths=` | public | EMI + amortization schedule |
| POST | `/api/loans` | applicant | Apply for a loan (EMI calculated automatically) |
| GET | `/api/loans?status=&page=&pageSize=` | any | List loans (applicants see only their own) |
| GET | `/api/loans/:id` | any | Loan with audit trail and allowed next statuses |
| PATCH | `/api/loans/:id/status` | analyst, admin | Move the loan through the workflow |
| GET | `/api/loans/summary` | analyst, admin | Count and amount per status |
| GET | `/api/health` | public | Health check (includes a DB ping) |

### Example

```bash
# login as the demo applicant
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"applicant@loandesk.dev","password":"Password@123"}' | jq -r .accessToken)

# apply for ₹5,00,000 over 24 months
curl -X POST localhost:3000/api/loans -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"businessName":"Sharma Traders","gstin":"07AAGFF2194N1Z1","amount":500000,"tenureMonths":24,"purpose":"Inventory"}'
# -> monthlyEmi: 24006.44 at the default 14% p.a.
```

## Tests

```bash
npm test
```

Covers EMI maths, the amortization schedule, workflow rules, ownership checks and the concurrent-update guard.

## Workflow rules

| From | To | Allowed roles |
|---|---|---|
| SUBMITTED | UNDER_REVIEW | analyst, admin |
| UNDER_REVIEW | APPROVED / REJECTED | analyst, admin |
| APPROVED | DISBURSED | admin |
| REJECTED, DISBURSED | none (final) | none |

## License

MIT
