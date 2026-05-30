require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const fhirRouter = require('./routes/fhir');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FHIR_API_KEY || '';

// ── Middleware ──
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ type: ['application/json', 'application/fhir+json'], limit: '10mb' }));

// ── Swagger UI ──
const specPath = path.join(__dirname, '..', 'openapi.json');
try {
  const spec = JSON.parse(JSON.stringify(require(specPath)));
  // CRITICAL: Override servers to use relative path so Try It Out works
  // The spec ships with https://api.example.com which causes CORS failures
  spec.servers = [{ url: '/fhir/r4', description: 'Local FHIR R4 Server' }];
  // Inject security scheme if API key is configured
  if (API_KEY) {
    spec.components = spec.components || {};
    spec.components.securitySchemes = {
      ...spec.components.securitySchemes,
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
    };
    spec.security = [{ ApiKeyAuth: [] }];
  }
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FHIR R4 API – Swagger',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  }));
  console.log('  Swagger UI loaded');
} catch (e) {
  console.log('  ⚠ Swagger UI: openapi.json not found, skipping —', e.message);
}

// ── API Key auth middleware (only for /fhir/r4 routes, skip /metadata) ──
if (API_KEY) {
  app.use('/fhir/r4', (req, res, next) => {
    // Allow unauthenticated access to metadata
    if (req.path === '/metadata') return next();
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'security',
          diagnostics: 'Missing or invalid X-Api-Key header',
        }],
      });
    }
    next();
  });
  console.log('  API Key auth enabled');
} else {
  console.log('  API Key auth disabled (set FHIR_API_KEY in .env to enable)');
}

// ── FHIR metadata (CapabilityStatement — no auth) ──
app.get('/fhir/r4/metadata', (req, res) => {
  res.set('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      security: API_KEY ? {
        service: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/restful-security-service', code: 'api-key' }] }],
        description: 'API Key required via X-Api-Key header',
      } : undefined,
      resource: [
        'Patient', 'Encounter', 'Observation', 'Condition', 'Procedure',
        'MedicationRequest', 'AllergyIntolerance', 'Immunization',
        'DiagnosticReport', 'Practitioner', 'Organization', 'Location',
        'Appointment', 'Claim',
      ].map(type => ({
        type,
        interaction: [
          { code: 'read' }, { code: 'search-type' },
          { code: 'create' }, { code: 'update' }, { code: 'delete' },
        ],
      })),
    }],
  });
});

// ── FHIR Routes ──
app.use('/fhir/r4', fhirRouter);

// ── Health check (no auth required) ──
app.get('/health', async (req, res) => {
  try {
    const store = process.env.DATABASE_URL ? require('./store-pg') : require('./store');
    const resources = await store.getStats();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      fhirVersion: '4.0.1',
      authEnabled: !!API_KEY,
      storeType: process.env.DATABASE_URL ? 'postgres' : 'json',
      resources,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// ── Serve OpenAPI spec (no auth required) ──
app.get('/openapi.json', (req, res) => {
  try { res.sendFile(specPath); } catch (e) { res.status(404).json({ error: 'OpenAPI spec not found' }); }
});

// ── Start ──
app.listen(PORT, '0.0.0.0', async () => {
  const store = process.env.DATABASE_URL ? require('./store-pg') : require('./store');
  const storeType = process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory JSON';
  try {
    const stats = await store.getStats();
    const total = Object.values(stats).reduce((s, r) => s + (r.count || 0), 0);
    console.log(`\n🔥 FHIR R4 Server running on http://localhost:${PORT}`);
    console.log(`   Store:     ${storeType}`);
    console.log(`   Base URL:  http://localhost:${PORT}/fhir/r4`);
    console.log(`   Swagger:   http://localhost:${PORT}/swagger`);
    console.log(`   Metadata:  http://localhost:${PORT}/fhir/r4/metadata`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`   Resources: ${total} loaded\n`);
  } catch (e) {
    console.log(`\n🔥 FHIR R4 Server running on http://localhost:${PORT}`);
    console.log(`   Store:     ${storeType}`);
    console.log(`   ⚠ Could not load stats: ${e.message}\n`);
  }
});

module.exports = app;
