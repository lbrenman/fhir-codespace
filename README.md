# FHIR R4 Codespace

A complete FHIR R4 development environment with a Node.js/Express backend, realistic sample clinical data, Swagger UI, and a React dashboard — all ready to run in GitHub Codespaces.

![FHIR R4](https://img.shields.io/badge/FHIR-R4%204.0.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/lbrenman/fhir-codespace?quickstart=1)

## What's Inside

- **FHIR R4 API Server** — Express server implementing the full FHIR R4 REST API (GET/POST/PUT/DELETE) across 14 resource types
- **Swagger UI** — Interactive API documentation and testing at `/swagger`
- **API Key Authentication** — Optional API key auth configurable via environment variable
- **Sample Clinical Data** — Realistic generated data: 25 patients, encounters, conditions, observations, medications, allergies, immunizations, procedures, appointments, claims, and more
- **React Dashboard** — Full CRUD interface with charts, search, and resource browsing
- **Persistent Data** — CRUD changes persist across Codespace restarts
- **PostgreSQL Support** — Optional Postgres backend with schema, seed data, and 12 stored procedures (works with Neon, Supabase, or any Postgres)
- **Configurable Backend** — Dashboard can point to a local or remote FHIR server via `.env`

## Quick Start

### GitHub Codespaces (Recommended)

1. Click **Code → Codespaces → Create codespace on main** (or use the badge above)
2. Wait for the container to build — dependencies install and sample data seeds automatically
3. Both the API server (port 3000) and dashboard (port 5173) start automatically
4. The dashboard opens in your browser when the Codespace is ready

That's it — no manual commands needed.

In case the dashboard and API Server is not automatically started:

```bash
# Install and seed
cd server && npm install && npm run seed && cd ..
cd dashboard && npm install && cd ..

# Start both (in separate terminals)
cd server && npm start
cd dashboard && npm run dev
```

### Local Development

```bash
git clone https://github.com/lbrenman/fhir-codespace.git
cd fhir-codespace

# Copy and configure environment
cp .env.example .env

# Install and seed
cd server && npm install && npm run seed && cd ..
cd dashboard && npm install && cd ..

# Start both (in separate terminals)
cd server && npm start
cd dashboard && npm run dev
```

## Architecture

```
fhir-codespace/
├── .devcontainer/          # Codespace configuration
│   └── devcontainer.json
├── .env.example            # Environment template
├── server/                 # FHIR R4 API server
│   ├── index.js            # Express app (Swagger, auth, routes)
│   ├── store.js            # In-memory FHIR data store with JSON persistence
│   ├── store-pg.js         # PostgreSQL-backed FHIR data store (optional)
│   ├── routes/
│   │   └── fhir.js         # FHIR REST API routes (auto-selects store)
│   ├── scripts/
│   │   └── generate-data.js # Sample data generator
│   └── data/               # Generated JSON data files (persistent)
├── dashboard/              # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main dashboard component
│   │   ├── api.js          # FHIR API client (supports local/remote)
│   │   ├── index.css       # Design system & styles
│   │   └── main.jsx        # React entry point
│   └── vite.config.js      # Vite config with API proxy
├── sql/                    # PostgreSQL scripts
│   ├── 000-cleanup.sql     # Drop all FHIR tables, functions, views
│   ├── 001-schema.sql      # Create tables, indexes, FKs, views
│   ├── 002-stored-procedures.sql # 12 stored procedures
│   ├── 003-seed-data.sql   # Sample data INSERT statements
│   ├── 004-validate.sql    # Validation queries
│   └── generate-inserts.js # Regenerate seed SQL from JSON data
├── openapi.json            # FHIR R4 OpenAPI spec
├── setup.sh                # Codespace auto-setup script
├── test-api.http           # VS Code REST Client test file
└── README.md
```

## API Endpoints

Base URL: `http://localhost:3000/fhir/r4`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/{ResourceType}` | Search/list resources |
| GET | `/{ResourceType}/{id}` | Read a specific resource |
| POST | `/{ResourceType}` | Create a new resource |
| PUT | `/{ResourceType}/{id}` | Update an existing resource |
| DELETE | `/{ResourceType}/{id}` | Delete a resource |
| GET | `/metadata` | FHIR CapabilityStatement |

### FHIR Search Parameters

The API supports standard FHIR search parameters:

```bash
# Pagination
GET /fhir/r4/Patient?_count=10&_offset=0

# Date search with FHIR prefixes (ge, le, gt, lt, eq)
GET /fhir/r4/Appointment?date=ge2026-06-01&date=le2026-06-30

# Patient/subject search by ID or name
GET /fhir/r4/MedicationRequest?patient=pat-001
GET /fhir/r4/Observation?patient=Margaret

# Status filter
GET /fhir/r4/Encounter?status=finished

# Combined
GET /fhir/r4/Observation?patient=pat-001&date=ge2025-01-01&date=le2025-12-31
```

### Utility Endpoints (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health & resource statistics |
| GET | `/swagger` | Swagger UI (interactive API docs) |
| GET | `/openapi.json` | OpenAPI specification |

### Sample Requests

```bash
# List all patients
curl http://localhost:3000/fhir/r4/Patient

# With API key (when FHIR_API_KEY is set)
curl -H "X-Api-Key: your-key" http://localhost:3000/fhir/r4/Patient

# Search with pagination
curl "http://localhost:3000/fhir/r4/Observation?_count=10&_offset=0"

# Create a patient
curl -X POST http://localhost:3000/fhir/r4/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{"resourceType":"Patient","name":[{"family":"Smith","given":["John"]}],"gender":"male"}'

# Update a patient
curl -X PUT http://localhost:3000/fhir/r4/Patient/{id} \
  -H "Content-Type: application/fhir+json" \
  -d '{"resourceType":"Patient","id":"{id}","name":[{"family":"Smith","given":["Jane"]}]}'

# Delete a patient
curl -X DELETE http://localhost:3000/fhir/r4/Patient/{id}
```

## Configuration

### Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `FHIR_API_KEY` | *(empty)* | API key for FHIR endpoints. When set, all `/fhir/r4` requests require `X-Api-Key` header. Leave empty to disable. |
| `FHIR_BASE_URL` | *(empty)* | Remote FHIR server URL for the dashboard. When set, the dashboard calls this URL instead of the local server. Example: `https://hapi.fhir.org/baseR4` |
| `DATABASE_URL` | *(empty)* | PostgreSQL connection string. When set, the server uses Postgres instead of in-memory JSON files. Example: `postgresql://user:pass@host:5432/dbname?sslmode=require` |

### API Key Authentication

1. Set `FHIR_API_KEY=your-secret-key` in `.env`
2. Restart the server
3. All `/fhir/r4` requests now require the `X-Api-Key: your-secret-key` header
4. The Swagger UI automatically includes an "Authorize" button for the API key
5. `/health`, `/swagger`, and `/openapi.json` remain open

### Remote FHIR Server

To point the dashboard at a remote FHIR server instead of the local one:

1. Set `FHIR_BASE_URL=https://your-fhir-server.com/fhir/r4` in `.env`
2. If the remote server requires an API key, also set `FHIR_API_KEY`
3. Restart the dashboard (`cd dashboard && npm run dev`)
4. The sidebar footer shows the active backend URL

### Data Persistence

- Sample data is generated once during initial setup (`npm run seed`)
- All CRUD operations persist to JSON files in `server/data/`
- Data survives Codespace restarts (workspace files are preserved)
- To regenerate fresh sample data: `cd server && npm run seed:force`

### PostgreSQL Backend (Optional)

By default, the server uses in-memory JSON files for storage. You can optionally connect it to a PostgreSQL database (e.g. [Neon](https://neon.tech)) for persistent, production-grade storage. The dashboard and API work identically either way — the store is swapped behind the scenes based on the `DATABASE_URL` environment variable.

#### 1. Set up the database

Run the SQL scripts in `sql/` against your Postgres database in order:

```bash
psql $DATABASE_URL -f sql/001-schema.sql           # Create 16 FHIR_ tables, indexes, views
psql $DATABASE_URL -f sql/003-seed-data.sql         # Insert ~1,300 rows of sample clinical data
psql $DATABASE_URL -f sql/002-stored-procedures.sql # Create 12 stored procedures
psql $DATABASE_URL -f sql/004-validate.sql          # Run 20 validation queries to verify
```

#### 2. Configure the server

Add your connection string to `.env`:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### 3. Start the server

```bash
cd server && npm install && npm start
```

The startup log will show `Store: PostgreSQL` instead of `Store: In-memory JSON`, and the `/health` endpoint will report `"storeType": "postgres"`.

#### SQL Scripts Reference

| File | Purpose |
|------|---------|
| `sql/000-cleanup.sql` | Drop all FHIR tables, functions, and views |
| `sql/001-schema.sql` | Create 16 tables with `FHIR_` prefix, indexes, foreign keys, and a `FHIR_Patient_Summary` view |
| `sql/002-stored-procedures.sql` | 12 stored procedures (search patients, patient summary, vitals, appointments by date range, active medications, conditions, allergies, observations, dashboard stats, latest vitals, full-text search, patient timeline) |
| `sql/003-seed-data.sql` | INSERT statements for all sample data |
| `sql/004-validate.sql` | 20 validation queries to verify setup |
| `sql/generate-inserts.js` | Node.js script to regenerate `003-seed-data.sql` from JSON data files (optional — the SQL file is already included) |

#### Stored Procedures

| Procedure | Usage |
|-----------|-------|
| `fhir_search_patients('thompson')` | Search patients by name, optionally filter by gender |
| `fhir_patient_summary('pat-001')` | Full patient record with all resource counts, age, total claims |
| `fhir_patient_vitals('pat-001')` | Time-series vital signs including blood pressure systolic/diastolic |
| `fhir_latest_vitals('pat-001')` | Most recent value per vital type |
| `fhir_search_appointments('2026-06-01', '2026-06-30')` | Appointments by date range, patient, and status |
| `fhir_active_medications('pat-001')` | Active medications with prescriber info |
| `fhir_medications_by_patient_name('Margaret', 'active')` | Medications by patient name (partial match), optional status filter |
| `fhir_patient_conditions('pat-001', 'active')` | Conditions filtered by clinical status |
| `fhir_patient_allergies('pat-001')` | Allergies sorted by criticality |
| `fhir_search_observations('pat-001', '8867-4', '2025-01-01', '2025-12-31')` | Observations by patient, LOINC code, and date range |
| `fhir_dashboard_stats()` | Resource counts across all tables |
| `fhir_fulltext_search('Sertraline')` | Cross-table JSONB text search |
| `fhir_patient_timeline('pat-001')` | Chronological event timeline across all resource types |

#### Switching back to JSON

Remove or comment out `DATABASE_URL` in `.env` and restart the server. It will revert to using the in-memory JSON store in `server/data/`.

### Exposing the API with ngrok

To make the FHIR API accessible from external applications (e.g. Amplify Fusion, Postman from another machine, a mobile app) during local development, you can use [ngrok](https://ngrok.com) to create a public tunnel to your local server.

#### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### 2. Authenticate (one-time)

Sign up at [ngrok.com](https://ngrok.com) and add your auth token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 3. Start the tunnel

With the FHIR server running on port 3000:

```bash
ngrok http 3000
```

ngrok will display a public URL like:

```
Forwarding  https://a1b2c3d4.ngrok-free.app -> http://localhost:3000
```

#### 4. Use the public URL

The FHIR API is now accessible from anywhere:

```bash
# From any machine on the internet
curl https://a1b2c3d4.ngrok-free.app/fhir/r4/Patient

# With API key
curl -H "X-Api-Key: your-key" https://a1b2c3d4.ngrok-free.app/fhir/r4/Patient

# Swagger UI
open https://a1b2c3d4.ngrok-free.app/swagger
```

You can also use this URL as the base URL in Amplify Fusion or any other external tool that needs to call the FHIR API.

> **Note:** The free ngrok tier generates a new URL each time you restart the tunnel. For a stable URL, use a paid ngrok plan or set up a reserved domain.

### Ports

| Port | Service |
|------|---------|
| 3000 | FHIR API Server + Swagger UI |
| 5173 | Dashboard (Vite dev server) |

## Resource Types & Sample Data

| Resource | Count | Description |
|----------|-------|-------------|
| Patient | 25 | Diverse patient demographics across 3 organizations |
| Encounter | ~80 | Ambulatory, inpatient, and emergency encounters |
| Condition | ~50 | ICD-10 coded conditions (hypertension, diabetes, etc.) |
| Observation | ~750 | Vital signs time-series (BP, HR, temp, SpO2, glucose, A1c, etc.) |
| MedicationRequest | ~55 | RxNorm coded medication orders |
| AllergyIntolerance | ~27 | Drug and food allergies |
| Immunization | ~56 | CVX coded vaccinations |
| Procedure | ~40 | CPT coded procedures |
| Appointment | 15 | Scheduled clinical appointments |
| Claim | 10 | Insurance claims |
| DiagnosticReport | 12 | Lab and imaging reports |
| Organization | 5 | Healthcare provider and insurer organizations |
| Practitioner | 8 | Physicians and specialists |
| Location | 6 | Facility locations (ER, ICU, clinics, etc.) |

## Dashboard Features

- **Overview Dashboard** — Stats cards, resource distribution pie chart, bar chart
- **Resource Browsing** — Tabular views for all 14 resource types with column-specific rendering
- **Detail Views** — Structured field display with JSON toggle, edit, and delete buttons
- **Patient Detail** — Vital signs time-series charts (blood pressure, heart rate, temperature, etc.) and related resources (conditions, medications, allergies, encounters)
- **Search & Filter** — Full-text search across all resource fields
- **CRUD Operations** — Create, view, edit, and delete resources
- **Smart Forms** — Structured forms with picklists (patient, practitioner, organization, location dropdowns) for all 14 resource types
- **Toast Notifications** — Success/error feedback on all operations
- **Swagger Link** — Quick access to API documentation from the sidebar

## Tech Stack

- **Backend**: Node.js 20, Express, swagger-ui-express
- **Frontend**: React 18, Vite, Recharts
- **Data**: In-memory JSON store with file persistence, or PostgreSQL (optional)
- **Database**: PostgreSQL with 12 stored procedures (Neon, Supabase, or self-hosted)
- **Auth**: Optional API key (X-Api-Key header)
- **Containerization**: GitHub Codespaces devcontainer

## License

MIT
