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
- **Configurable Backend** — Dashboard can point to a local or remote FHIR server via `.env`

## Quick Start

### GitHub Codespaces (Recommended)

1. Click **Code → Codespaces → Create codespace on main** (or use the badge above)
2. Wait for the container to build — dependencies install and sample data seeds automatically
3. Both the API server (port 3000) and dashboard (port 5173) start automatically
4. The dashboard opens in your browser when the Codespace is ready

That's it — no manual commands needed.

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
│   ├── routes/
│   │   └── fhir.js         # FHIR REST API routes
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
├── openapi.json            # FHIR R4 OpenAPI spec
├── test-api.http           # VS Code REST Client test file
└── README.md
```

## API Endpoints

Base URL: `http://localhost:3000/fhir/r4`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/{ResourceType}` | Search/list resources (supports `_count`, `_offset`, `_filter`) |
| GET | `/{ResourceType}/{id}` | Read a specific resource |
| POST | `/{ResourceType}` | Create a new resource |
| PUT | `/{ResourceType}/{id}` | Update an existing resource |
| DELETE | `/{ResourceType}/{id}` | Delete a resource |
| GET | `/metadata` | FHIR CapabilityStatement |

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

### Ports

| Port | Service |
|------|---------|
| 3000 | FHIR API Server + Swagger UI |
| 5173 | Dashboard (Vite dev server) |

## Resource Types & Sample Data

| Resource | Count | Description |
|----------|-------|-------------|
| Patient | 25 | Diverse patient demographics across 3 organizations |
| Encounter | ~70 | Ambulatory, inpatient, and emergency encounters |
| Condition | ~50 | ICD-10 coded conditions (hypertension, diabetes, etc.) |
| Observation | ~110 | Vital signs and lab results (BP, HR, glucose, A1c, etc.) |
| MedicationRequest | ~50 | RxNorm coded medication orders |
| AllergyIntolerance | ~15 | Drug and food allergies |
| Immunization | ~50 | CVX coded vaccinations |
| Procedure | ~30 | CPT coded procedures |
| Appointment | 15 | Scheduled clinical appointments |
| Claim | 10 | Insurance claims |
| DiagnosticReport | 12 | Lab and imaging reports |
| Organization | 5 | Healthcare provider and insurer organizations |
| Practitioner | 8 | Physicians and specialists |
| Location | 6 | Facility locations (ER, ICU, clinics, etc.) |

## Dashboard Features

- **Overview Dashboard** — Stats cards, resource distribution pie chart, bar chart
- **Resource Browsing** — Tabular views for all 14 resource types with column-specific rendering
- **Search & Filter** — Full-text search across all resource fields
- **CRUD Operations** — Create, view (JSON detail), edit, and delete resources
- **Form-based Editing** — Structured forms for Patient, Organization, and Practitioner; JSON editor for all other types
- **Toast Notifications** — Success/error feedback on all operations
- **Swagger Link** — Quick access to API documentation from the sidebar

## Tech Stack

- **Backend**: Node.js 20, Express, swagger-ui-express
- **Frontend**: React 18, Vite, Recharts
- **Data**: In-memory JSON store with file persistence
- **Auth**: Optional API key (X-Api-Key header)
- **Containerization**: GitHub Codespaces devcontainer

## License

MIT
