# Laundry App

Full-stack web application for managing shared amenities in a residential building. Residents can book laundry machines, request rooftop access, and review their booking history, while administrators manage users, machines, and approval workflows.

---

## Repository Structure

```
.
├── backend   # Spring Boot service (REST API, authentication, data access)
├── frontend  # React + Vite single-page application
└── scripts   # Auxiliary tooling (account generation utilities, mock-data placeholder)
```

---

## Technology Stack

- **Backend:** Java 21, Spring Boot 3.4 (Web, Data JPA, Security, Validation, Session JDBC), PostgreSQL, Docker Compose
- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, CSS Modules
- **Build & Tooling:** Gradle, Lombok, ESLint, vite-plugin-svgr

---

## Key Features

- **Authentication & Authorization:** Session-based login via room number/password, role hierarchy for granular access control (USER, STAFF, LAUNDRY_ADMIN, ROOFTOP_ADMIN, MASTER_ADMIN).
- **Laundry Management:** Machine catalog with configurable slot durations, daily booking grid, batch checkout, per-user weekly time limits, cooldown enforcement, overlap protection, and slot overrides for maintenance or schedule extensions.
- **Rooftop Management:** Monthly calendar view, resident request workflow (pending/approved/rejected/cancelled states), admin approvals that create definitive bookings, and per-user booking/request history.
- **Dashboard:** Personalized home view that surfaces laundry usage, rooftop status, and admin alerts via aggregated metrics.
- **Presidium Directory:** Public listing of resident representatives with admin-managed bios, contacts, and ordering controls.
- **Administration:** Master admins manage users, presidium members (CRUD, visibility, ordering), laundry admins manage machines, rooftop admins process booking requests.
- **Responsive UI:** Reusable layout, theme toggle (light/dark), mobile-friendly navigation, and modular components for forms, tables, and cards.

---

## Backend Overview (`backend/`)

### Modules & Packages

| Package | Responsibility |
|---------|----------------|
| `de.clickism.guckelsberg.auth` | Login endpoint, role hierarchy configuration |
| `de.clickism.guckelsberg.config` | CORS and Spring Security setup (session management, authentication provider) |
| `de.clickism.guckelsberg.user` | User entity, repository, CRUD controller, and admin seeding |
| `de.clickism.guckelsberg.laundry` | Machine and booking entities, repositories, controllers, and business rules |
| `de.clickism.guckelsberg.rooftop` | Rooftop bookings, request workflow, and approvals |
| `de.clickism.guckelsberg.dashboard` | Aggregated dashboard metrics exposed to the frontend |

### Data Model Highlights

- **User** — Identified by `roomNumber`, stores `passwordHash`, role, booking activity timestamps, and optional weekly washer/dryer minute caps. `AdminUserInitializer` seeds a `MASTER_ADMIN` (`admin` / `guckelsberg`).
- **LaundryMachine** — Defines machine name, type (`WASHER` or `DRYER`), and slot duration (default slot granularity is 90 minutes).
- **LaundryBooking** — Associates a user, machine, date, and slot start. Uniqueness enforced per machine/date/slot combination with helpers for overlap, past/ongoing detection, and DTO conversion.
- **RooftopBooking** — One booking per day; includes creator, date, and free-text reason.
- **RooftopBookingRequest** — Captures user requests with contact details and time span. Approval both records approver info and instantiates a confirmed `RooftopBooking`.

### Business Rules

- **LimitsChecker** enforces a 15-second booking cooldown, a 7-day advance window, and per-user weekly minute quotas (defaults: 9h for washers, 18h for dryers) before persisting laundry bookings.
- Slot validation prevents past bookings, overlaps (including adjacent-day buffers), and ensures slot starts align with 90-minute increments.
- Rooftop requests cannot target past days; approving a request is limited to admins and fails if the target day is already booked.

### Security & Sessions

- Spring Security authenticates against `UserRepository` using BCrypt hashes. Role hierarchy (e.g., `MASTER_ADMIN` ⇒ `LAUNDRY_ADMIN`/`ROOFTOP_ADMIN` ⇒ `STAFF` ⇒ `USER`) powers method-level security annotations.
- Session state is persisted via Spring Session JDBC; `spring.session.jdbc.initialize-schema=always` bootstraps the schema.
- CSRF is disabled for SPA usage, and CORS allows local development origins (`http://localhost:5173`, optional LAN overrides).

### Configuration

Environment variables drive the PostgreSQL connection:

| Property | Description |
|----------|-------------|
| `DB_USERNAME` | Database username (used by Spring) |
| `DB_PASSWORD` | Database password |
| `DB_USER`     | Database user for Docker Compose (if using bundled Postgres) |

`application.properties` targets `jdbc:postgresql://localhost:5432/guckelsberg`. Adjust host/port if the database runs elsewhere.

### Running the Backend

```bash
cd backend

# (Optional) Start Postgres via Docker Compose
cat > .env <<EOF
DB_USER=postgres
DB_PASSWORD=postgres
EOF
docker compose up -d

# Export credentials for Spring Boot (matches the database user)
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

# Launch the API
./gradlew bootRun
```

The API listens on `http://localhost:8080`. Swagger is not bundled; interact through the frontend or directly via REST clients.

### Core REST Endpoints

- **Auth:** `POST /auth/login`, `GET /auth/status`, `POST /auth/logout`
- **Laundry:**
  - `GET /api/laundry/machines`, `POST /api/laundry/machines`, `DELETE /api/laundry/machines`
  - `GET /api/laundry/bookings/today`, `GET /api/laundry/bookings/date/{yyyy-MM-dd}`, `POST /api/laundry/bookings`, `POST /api/laundry/bookings/batch`, `DELETE /api/laundry/bookings`
  - User-specific history at `/api/laundry/bookings/future/me` and `/api/laundry/bookings/all/me`
  - Overrides: `GET /api/laundry/overrides`, `POST /api/laundry/overrides`, `PATCH /api/laundry/overrides/{id}`, `DELETE /api/laundry/overrides/{id}`
- **Rooftop:**
  - `GET /api/rooftop/bookings/month/{yyyy-MM}`
  - `GET /api/rooftop/bookings/me`, `GET /api/rooftop/bookings` (admin, filterable)
  - Requests via `POST /api/rooftop/bookings/requests`, user lookups at `/api/rooftop/bookings/requests/me`, admin approvals at `/api/rooftop/bookings/requests/{id}/approve`
  - Additional request actions: `POST /api/rooftop/bookings/requests/{id}/reject`, `POST /api/rooftop/bookings/requests/{id}/cancel`, list/search via `GET /api/rooftop/bookings/requests`
- **Dashboard:** `GET /api/dashboard/summary`
- **Presidium:** public `GET /api/presidium`, admin endpoints `GET /api/presidium/all`, `POST /api/presidium`, `PATCH /api/presidium/{id}`, `DELETE /api/presidium/{id}`
- **Users:** `GET /api/users/all`, `POST /api/users`, `PATCH /api/users/{roomNumber}`, `DELETE /api/users/{roomNumber}`, `POST /api/users/bulk/generate` (master admin only)

All mutating endpoints require authentication and appropriate role membership.

---

## Frontend Overview (`frontend/`)

### Application Flow

- **Entry Point:** `src/main.tsx` bootstraps React Router and TanStack Query within a `<BrowserRouter>` and shared `QueryClient`.
- **Routing (`App.tsx`):** Defines pages for home, login/out, laundry, rooftop, history, and admin dashboards. Wildcard routes fall back to a custom 404 page.
- **State & Data Fetching:** `src/utils.ts` wraps `fetch` with cookie credentials and timeouts, while feature-specific hooks in `features/*/queries.ts` manage data via React Query (stale times, refetch intervals, optimistic invalidation).

### Feature Modules

- **User (`features/user`)** — Login form, logout handler, history view, and shared hooks/models for user data and admin CRUD.
- **Laundry (`features/laundry`)** — Booking table, next-free-slot finder, personal bookings list, checkout flow, and reusable models/utilities for slot math.
- **Rooftop (`features/rooftop`)** — Monthly calendar visualization, request form, admin approval UI, and helpers for date comparisons.
- **Admin (`features/admin`)** — Windowed dashboard that conditionally exposes sub-tools based on role:
  - User management (search, edit, delete, create with optional per-user limits and bulk credential generation)
  - Machine administration (listing and creation/deletion)
  - Laundry slot overrides (block or extend availability, CSV-friendly listings)
  - Rooftop request management (filter requests by status/booker, approve with optional notes, reject with reasons, review audit trail)

### Shared Components

- Layout system with responsive navbar, hamburger menu, theme toggle (`themes.ts`), and user dropdown.
- Generic `Form` component used across login, user CRUD, and rooftop requests, supporting validation states, select options, textarea fields, and custom submit handlers.
- Utility widgets: `WindowedView`, `Card`, `Button`, `MessageBox`, `PageControls`, `DateControls`, and loading indicators, all styled via CSS Modules.

### Development & Build Scripts

```bash
cd frontend
npm install

# Run Vite dev server (http://localhost:5173) with API proxy to :8080
npm run dev

# Lint and build
npm run lint
npm run build
```

The Vite server proxies `/api` and `/auth` to the backend, preserving cookies for session authentication during development.

### Theming & Styling

- Global CSS variables (`src/index.css`) define both light and dark theme palettes. `ThemeToggle` mutates `localStorage` state and updates document attributes/`<meta name="theme-color">`.
- Component-level styling relies on modular CSS files to avoid naming collisions.

---

## Account Generation Utility (`scripts/`)

- `generate_accounts.py` logs in as a master admin, calls `POST /api/users/bulk/generate`, and prints a table (optionally CSV) with the new credentials. It now supports:
  - `--building` to auto-generate accounts for a floor/room range. Combine with
    `--floor-range`, `--room-range`, `--double-rooms`, and `--occupant-padding`
    to match the Guckelsberg layout (default: floors `00-11`, rooms `00-09`,
    double occupancy for `00,01,04,05,08,09`).
  - `--dry-run` to preview credentials locally without hitting the API.
  - Existing options such as `--overwrite` (rotate passwords),
    `--password-length` (min 8), `--rooms-file`, and layout strings.

Guckelsberg example (preview only):

```bash
python scripts/generate_accounts.py \
  --building \
  --floor-range 00-11 \
  --room-range 00-09 \
  --double-rooms "00,01,04,05,08,09" \
  --dry-run \
  --output guckelsberg-preview.csv
```

Run the same command without `--dry-run` to create the accounts on the server
and retrieve the production CSV. Master admins can also trigger the same flow
from the new **Bulk Generate** tab in the web UI (Admin → Users → Bulk Generate).

---

## Hosting on Railway

1. **Create the project & database**
   - Provision a new Railway project and add the PostgreSQL add-on.
   - Copy the generated credentials (host, port, database, username, password).
2. **Deploy the backend service**
   - Add a new service from this repository and set the working directory to
     `backend`.
   - Build command: `./gradlew clean bootJar`
   - Start command: `java -jar build/libs/backend-0.0.1-SNAPSHOT.jar`
3. **Configure environment variables** (Service → Variables):
   - `DB_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require`
   - `DB_USERNAME=<username>`
   - `DB_PASSWORD=<password>`
   - Optionally set `SPRING_PROFILES_ACTIVE=prod`
   Railway injects `PORT`; Spring Boot automatically binds to it via
   `server.port=${PORT:8080}`.
4. **Expose the frontend**
   - Option A: Build the SPA (`cd frontend && npm install && npm run build`) and
     serve `/dist` via a Railway static site.
   - Option B: Use a separate hosting provider for the static assets and point
     it to the Railway backend URL. Make sure to add the production origin to
     the CORS whitelist in `SecurityConfig`.

After the service turns green, navigate to the generated Railway domain and
verify `/auth/status` responds with HTTP 200 when accessed with cookies.

---

## Deployment Considerations

- Ensure environment variables for database credentials are set in the runtime environment (application servers, container orchestrators, etc.).
- Update `SecurityConfig.corsConfigurationSource()` if deploying the frontend under a different domain.
- Replace the seeded admin password in production environments via `UserController` or database migration.
- PostgreSQL schema is managed via Hibernate auto-update; for production, consider switching to a migration tool (Flyway/Liquibase) for deterministic schema evolution.

---

## Contributing

1. Fork and clone the repository.
2. Create a feature branch and make changes using `./gradlew` (backend) and `npm` (frontend).
3. Run `npm run lint` and relevant backend checks before submitting PRs.
4. Document new endpoints or UI flows in this README where applicable.

Feedback and contributions are welcome!
