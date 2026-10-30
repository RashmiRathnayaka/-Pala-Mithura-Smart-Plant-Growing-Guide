# පැළ මිතුරා (Pala Mithura) – Smart Plant Growing Guide

A Sinhala-first mobile app that helps Sri Lankan growers learn how to grow plants, track their own garden, and get AI-assisted help with plant problems. Every AI recommendation is reviewed by an Agricultural Instructor before it is treated as approved advice.


## 📱 Application Screenshots

### Loading Screen
![Loading Screen](Screenshots./LoadingPage.jpeg)

### Login Page
![Login Page Screen](Screenshots./LoginPage.jpeg)

### Home Screen
![Pala Mithura Home Screen](Screenshots./HomePage.jpeg)

### Plant Analysis
![Plant Analysis Screen](Screenshots./Analysing.jpeg)

### Plant Growing Guide
![Plant Guide Screen](Screenshots./PlantPage.jpeg)

### Profile
![Profile Screen](Screenshots./ProfilePage.jpeg)

### Instructor Dashboard
![Instructor Dashboard Screen](Screenshots./InstructorDashboard.jpeg)

### Admin Dashboard
![Admin Dashboard Screen](Screenshots./AdminDashboard.jpeg)


| Part | Technology |
|---|---|
| Mobile app (`mobile/`) | React Native, Expo SDK 58, Expo Router, Noto Sans Sinhala |
| API (`backend/`) | Node.js, Express 5, MongoDB with Mongoose, JWT, role-based access |
| AI | Claude (Anthropic API) with photo analysis; offline test provider for local development |
| Images | Cloudinary, or local disk for testing |

---

## 1. What you need

- **Node.js 20 or newer** (`node -v`)
- **MongoDB**, either:
  - local: install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and keep the service running, or
  - cloud: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (copy its connection string)
- **Expo Go** on your phone (Play Store / App Store), matching **SDK 58**. If Expo Go isn't on SDK 58 yet on your store, use an Android emulator or a development build (`npx expo run:android`).
- Optional: an **Anthropic API key** (for real AI analysis) and a **Cloudinary** account (for image hosting).

---

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env`:

| Variable | What to put |
|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/pala_mithura` (local) or your Atlas string **with a database name**, e.g. `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/pala_mithura?retryWrites=true&w=majority`. For Atlas, also add your IP under **Security → Network Access** |
| `JWT_SECRET` | a long random string, e.g. output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ANTHROPIC_API_KEY` | your key from <https://console.anthropic.com>. Leave empty to use the offline test provider |
| `AI_MODEL` | defaults to `claude-sonnet-5-5` |
| `STORAGE_PROVIDER` | `local` (default) or `cloudinary` |
| `CLOUDINARY_*` | only needed when `STORAGE_PROVIDER=cloudinary` |
| `PUBLIC_BASE_URL` | `http://<your-computer-LAN-IP>:5000` when testing on a phone |

Then load the sample data and start the server:

```bash
npm run seed      # categories, 9 sample crops, disease knowledge base, demo accounts
npm run dev       # starts http://localhost:5000 with auto-reload
```

Check it: open <http://localhost:5000/api/health>. You should see `"db": "connected"`.

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@palamithura.lk` | `Admin@12345` |
| Agricultural Instructor | `instructor@palamithura.lk` | `Instructor@12345` |
| Farmer / user | `farmer@palamithura.lk` | `Farmer@12345` |

Change these (in `.env`, before seeding) for anything beyond local testing. `npm run seed:reset` wipes **all** data and reseeds.

---

## 3. Run the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. The phone and computer must be on the **same Wi-Fi**.

The app finds the API automatically on the computer serving Expo (port 5000). If it can't connect, copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:5000`, then restart Expo. On Windows, find the LAN IP with `ipconfig` (IPv4 address), and allow Node.js through Windows Firewall when asked. The server address is shown at the bottom of the Profile screen.

- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`
- Browser preview: `npx expo start --web` (camera and reminders are phone-only)

---

## 4. AI provider

- **Claude (production):** set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`. The backend sends the crop's knowledge-base data, the user's growing history, the reported symptoms and up to 4 photos. The model must answer through a structured tool call, so the result can be validated before it is saved.
- **Offline test provider (local fallback):** used automatically in development when no key is set. It does **not** look at photos; it ranks known diseases by matching symptoms. Its output is clearly labelled "test output" in the app and in the database (`aiMeta.isTestOutput`).
- **In production without a key,** the AI step is treated as failed. The report then goes straight to an instructor, who writes the recommendation.

Safety rules are enforced on the server, whichever provider is used:

- The prompt forbids definite diagnoses and pesticide doses.
- Confidence is capped at "medium" when no photo was analysed.
- Only one cause can be "high" likelihood.
- A chemical-safety reminder is always added.
- The farmer's text is treated as data, not instructions.

---

## 5. Image storage

- `STORAGE_PROVIDER=local` saves images in `backend/uploads/` and serves them at `/uploads/...`. This is fine for testing.
- `STORAGE_PROVIDER=cloudinary` uploads to Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` from your Cloudinary dashboard.

Uploads are checked by file signature (JPEG/PNG/WebP only, not just the extension), limited to `MAX_IMAGE_SIZE_MB` (5 MB) each, with at most 6 per request.

---

## 6. The recommendation workflow

```
farmer submits report ─▶ AI analysis ─▶ ai_generated ─▶ pending_review ─▶ instructor:
                                 │                                        ├─ Accept  ─▶ accepted ─┐
                                 └─ AI fails ─▶ pending_review (no draft) ├─ Modify  ─▶ modified ─┼─▶ published ─▶ farmer notified
                                                                          └─ Reject  ─▶ rejected ─┘
```

- **Accept:** approves the AI draft unchanged, with an optional comment.
- **Modify:** the instructor edits causes, actions, fertilizer advice and so on, and must explain the changes.
- **Reject:** a reason is required. The instructor can add safe alternative advice or ask the farmer for more information.
- **Review state is hidden until published.** Until then the farmer only sees the AI draft, marked "preliminary". After a rejection the AI text is hidden from the farmer.
- **Only instructors can decide,** and each item can be decided only once (atomic update, so two instructors can't both decide).
- **Every step is written to an append-only audit log:** the original AI version, the instructor's changes, the decision, reviewer and timestamps. The audit history is shown on the review screen.

---

## 7. About the plant data

The 9 sample crops are a starting point. Admins and instructors can edit them in the app.

- **Tomato, brinjal, okra, cucumber, beans and mango:** spacing, fertilizer schedules (kg/ha), seasons, harvest windows and disease lists come from Department of Agriculture Sri Lanka crop pages. The source link is stored on each record.
- **Chilli, papaya and banana:** no DOA crop page was reachable when the data was prepared. Their cultivation figures are **left blank and marked unverified** instead of guessed.
- **Watering intervals** are app defaults marked "estimate", because the DOA pages don't give fixed intervals. Users can change them per plant.
- **Every record starts as "needs review".** The app shows a notice and "Not added yet" for missing values until an instructor verifies the record.
- **Fertilizer rates** are shown per hectare with a g/m² conversion for small plots (kg/ha ÷ 10).

---

## 8. Tests

```bash
cd backend
npm test          # 62 tests; needs MongoDB running locally (uses the pala_mithura_test database)
```

The tests cover:

- auth and roles
- search, including Sinhala
- image upload validation
- My Plants schedules
- the full report → AI → accept / modify / reject → publish → notify workflow, including AI failure and privacy checks
- admin functions

Set `MONGO_URI_TEST` to use a different database.

Mobile: `cd mobile && npm run lint`.

---

## 9. Project structure

```
backend/
  src/
    app.js, server.js          Express app and startup
    config/                    environment + MongoDB connection
    models/                    User, Category, Plant, Disease, UserPlant, ProblemReport,
                               Recommendation, AuditLog, Notification, Counter
    middleware/                JWT auth + roles, zod validation, image upload checks, errors
    services/
      ai/                      Claude provider, offline provider, schema, safety rules
      recommendationService.js the review workflow
      reminderService.js       crop-specific watering / fertilizer / harvest schedules
      storageService.js        Cloudinary / local images
    controllers/, routes/      REST endpoints
    seed/                      sample categories, crops, diseases (with sources)
  tests/                       integration + unit tests
mobile/
  src/app/                     screens (Expo Router: every file is a route)
    (tabs)/                    farmer: home, garden, report, advice, profile
    plant/, garden/, analysis/, recommendation/
    instructor/                dashboard, queue, review/[id], history
    admin/                     dashboard, users, plants & diseases
  src/components/              shared UI
  src/lib/                     API client, auth, i18n (si/en), reminders
```

### Screens

| # | Screen | Route |
|---|---|---|
| 1 | Splash | `/` |
| 2 | Login / Registration | `/login`, `/register` |
| 3 | Home dashboard | `/home` |
| 4 | Plant categories | `/categories` |
| 5 | Search results | `/search` |
| 6 | Plant details & growing guide | `/plant/[id]` |
| 7 | My Plants | `/garden` |
| 8 | Add plant | `/garden/add` |
| 9 | Growth timeline | `/garden/[id]` |
| 10 | Problem reporting | `/report` |
| 11 | AI analysis results | `/analysis/[id]` |
| 12 | My recommendations | `/advice` |
| 13 | Recommendation & instructor feedback | `/recommendation/[id]` |
| 14 | Profile & settings | `/profile`, `/settings` |
| 15 | Instructor dashboard | `/instructor` |
| 16 | Pending review queue | `/instructor/queue` |
| 17 | Accept / Modify / Reject | `/instructor/review/[id]` |
| 18 | Review history | `/instructor/history` |
| 19 | Admin dashboard | `/admin` (+ `/admin/users`) |
| 20 | Plant & disease management | `/admin/plants`, `/admin/plant-edit`, `/admin/disease-edit` |

### Main API endpoints (prefix `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `PATCH /auth/me/password`, `POST /auth/me/avatar` |
| Plants | `GET /plants?q=&category=&season=&zone=&sort=`, `GET /plants/recommended`, `GET /plants/:id`, `POST/PATCH/DELETE /plants/:id`, `POST /plants/:id/verify`, `POST/DELETE /plants/:id/images` |
| Catalog | `GET/POST/PATCH/DELETE /categories`, `GET/POST/PATCH/DELETE /diseases` |
| Favourites | `GET /favorites`, `POST/DELETE /favorites/:plantId` |
| My Plants | `GET/POST /my-plants`, `GET/PATCH/DELETE /my-plants/:id`, `POST /my-plants/:id/watering`, `/fertilizer`, `/notes`, `/photos`, `GET /my-plants/:id/timeline`, `GET /my-plants/reminders` |
| Reports | `POST /reports` (multipart, runs the AI), `GET /reports`, `GET /reports/:id` |
| Recommendations | `GET /recommendations`, `GET /recommendations/:id` |
| Instructor | `GET /instructor/dashboard`, `/queue`, `/history`, `GET /instructor/recommendations/:id`, `POST …/review`, `POST …/publish`, `POST …/regenerate`, `GET …/audit` |
| Admin | `GET /admin/stats`, `/activity`, `GET/POST /admin/users`, `PATCH /admin/users/:id`, `POST /admin/users/:id/reset-password` |
| Other | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `GET /meta`, `GET /health` |

---

## 10. Notes and limits

- **Light / dark mode:** Profile → Appearance offers Light, Dark, or System (follows the phone setting). The choice is saved on the device.

- **Reminders** are local phone notifications scheduled from each crop's own schedule. They work in Expo Go. Remote push notifications need a development build.
- **Plant photos:** the seed data has no photos. Add them from Admin → Plant & disease management → edit a plant → "Add a photo". Until then each plant shows a coloured placeholder.
- **Security:**
  - passwords are hashed with bcrypt
  - tokens are rejected after a password change or account deactivation
  - auth and report submission are rate-limited
  - instructors never see farmers' email or phone numbers
- **Not medical or legal advice:** the app's recommendations are agricultural guidance for review by qualified instructors.
