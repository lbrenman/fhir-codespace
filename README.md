# FHIR R4 Codespace

A complete FHIR R4 development environment with a Node.js/Express backend, realistic sample clinical data, and a React dashboard — all ready to run in GitHub Codespaces.

![FHIR R4](https://img.shields.io/badge/FHIR-R4%204.0.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## What's Inside

- **FHIR R4 API Server** — Express server implementing the full FHIR R4 REST API (GET/POST/PUT/DELETE) across 14 resource types
- **Sample Clinical Data** — Realistic generated data: 25 patients, encounters, conditions, observations, medications, allergies, immunizations, procedures, appointments, claims, and more
- **React Dashboard** — Full CRUD interface with charts, search, and resource browsing powered by Recharts
- **OpenAPI Spec** — Complete FHIR R4 OpenAPI 3.0 specification (289 endpoints)

## Quick Start

### GitHub Codespaces (Recommended)

1. Click **Code → Codespaces → Create codespace on main**
2. Wait for the container to build and dependencies to install
3. The API server starts automatically on port **3000**
4. Open a terminal and start the dashboard:
   ```bash
   cd dashboard && npm run dev
   ```
5. Open the forwarded port **5173** in your browser

### Local Development

```bash
# Clone the repo
git clone https://github.com/lbrenman/fhir-codespace.git
cd fhir-codespace

# Install dependencies
cd server && npm install && cd ..
cd dashboard && npm install && cd ..

# Generate sample data
cd server && npm run seed && cd ..

# Start the API server
cd server && npm start &

# Start the dashboard
cd dashboard && npm run dev
```

## Architecture

```
fhir-codespace/
├── .devcontainer/          # Codespace configuration
│   └── devcontainer.json
├── server/                 # FHIR R4 API server
│   ├── index.js            # Express app entry point
│   ├── store.js            # In-memory FHIR data store
│   ├── routes/
│   │   └── fhir.js         # FHIR REST API routes
│   ├── scripts/
│   │   └── generate-data.js # Sample data generator
│   └── data/               # Generated JSON data files
├── dashboard/              # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main dashboard component
│   │   ├── api.js          # FHIR API client
│   │   ├── index.css       # Design system & styles
│   │   └── main.jsx        # React entry point
│   └── vite.config.js      # Vite config with API proxy
├── openapi.json            # FHIR R4 OpenAPI spec
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

### Utility Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `http://localhost:3000/health` | Server health & resource statistics |
| GET | `http://localhost:3000/openapi.json` | OpenAPI specification |

### Sample Requests

```bash
# List all patients
curl http://localhost:3000/fhir/r4/Patient

# Get a specific patient
curl http://localhost:3000/fhir/r4/Patient/{id}

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

## Resource Types & Sample Data

| Resource | Count | Description |
|----------|-------|-------------|
| Patient | 25 | Diverse patient demographics across 3 organizations |
| Encounter | 50-100 | Ambulatory, inpatient, and emergency encounters |
| Condition | 25-75 | ICD-10 coded conditions (hypertension, diabetes, etc.) |
| Observation | 75-150 | Vital signs and lab results (BP, HR, glucose, A1c, etc.) |
| MedicationRequest | 25-75 | RxNorm coded medication orders |
| AllergyIntolerance | 0-50 | Drug and food allergies |
| Immunization | 25-75 | CVX coded vaccinations |
| Procedure | 25-50 | CPT coded procedures |
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

## Configuration

### Ports

| Port | Service |
|------|---------|
| 3000 | FHIR API Server |
| 5173 | Dashboard (Vite dev server) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |

## Tech Stack

- **Backend**: Node.js 20, Express
- **Frontend**: React 18, Vite, Recharts
- **Data**: In-memory JSON store with file persistence
- **Containerization**: GitHub Codespaces devcontainer

## License

MIT
