const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fhirRouter = require('./routes/fhir');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ type: ['application/json', 'application/fhir+json'], limit: '10mb' }));

// ── FHIR metadata (CapabilityStatement) ──
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

// ── Health check ──
app.get('/health', (req, res) => {
  const store = require('./store');
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    fhirVersion: '4.0.1',
    resources: store.getStats(),
  });
});

// ── Serve OpenAPI spec ──
const specPath = path.join(__dirname, '..', 'openapi.json');
app.get('/openapi.json', (req, res) => {
  try {
    res.sendFile(specPath);
  } catch (e) {
    res.status(404).json({ error: 'OpenAPI spec not found' });
  }
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔥 FHIR R4 Server running on http://localhost:${PORT}`);
  console.log(`   Base URL: http://localhost:${PORT}/fhir/r4`);
  console.log(`   Metadata: http://localhost:${PORT}/fhir/r4/metadata`);
  console.log(`   Health:   http://localhost:${PORT}/health`);
  console.log(`   Spec:     http://localhost:${PORT}/openapi.json\n`);
});

module.exports = app;
