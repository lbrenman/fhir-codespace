const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const force = process.argv.includes('--force');

// Skip generation if data already exists (preserves across restarts)
if (!force && fs.existsSync(dataDir) && fs.readdirSync(dataDir).some(f => f.endsWith('.json'))) {
  console.log('✅ Sample data already exists. Use --force to regenerate.');
  process.exit(0);
}

const uid = () => crypto.randomUUID().split('-')[0];

// ── Organizations ──
const organizations = [
  { id: 'org-mercy', name: 'Mercy General Hospital', type: 'prov', city: 'Sacramento', state: 'CA', phone: '916-555-0100' },
  { id: 'org-cedar', name: 'Cedar Valley Medical Center', type: 'prov', city: 'Portland', state: 'OR', phone: '503-555-0200' },
  { id: 'org-beacon', name: 'Beacon Health Partners', type: 'prov', city: 'Boston', state: 'MA', phone: '617-555-0300' },
  { id: 'org-payer1', name: 'BlueCross National', type: 'ins', city: 'Chicago', state: 'IL', phone: '312-555-0400' },
  { id: 'org-payer2', name: 'Aetna Health Plans', type: 'ins', city: 'Hartford', state: 'CT', phone: '860-555-0500' },
];

// ── Practitioners ──
const practitioners = [
  { id: 'prac-chen', family: 'Chen', given: 'Wei', gender: 'female', specialty: 'Internal Medicine', org: 'org-mercy', phone: '916-555-2001' },
  { id: 'prac-okonkwo', family: 'Okonkwo', given: 'Emeka', gender: 'male', specialty: 'Cardiology', org: 'org-mercy', phone: '916-555-2002' },
  { id: 'prac-rodriguez', family: 'Rodriguez', given: 'Maria', gender: 'female', specialty: 'Pediatrics', org: 'org-cedar', phone: '503-555-2003' },
  { id: 'prac-johnson', family: 'Johnson', given: 'David', gender: 'male', specialty: 'Orthopedics', org: 'org-cedar', phone: '503-555-2004' },
  { id: 'prac-patel', family: 'Patel', given: 'Ananya', gender: 'female', specialty: 'Neurology', org: 'org-beacon', phone: '617-555-2005' },
  { id: 'prac-kim', family: 'Kim', given: 'Soo-Jin', gender: 'female', specialty: 'Oncology', org: 'org-beacon', phone: '617-555-2006' },
  { id: 'prac-brown', family: 'Brown', given: 'James', gender: 'male', specialty: 'Emergency Medicine', org: 'org-mercy', phone: '916-555-2007' },
  { id: 'prac-nguyen', family: 'Nguyen', given: 'Linh', gender: 'female', specialty: 'Dermatology', org: 'org-cedar', phone: '503-555-2008' },
];

// ── Locations ──
const locations = [
  { id: 'loc-mercy-er', name: 'Mercy General - Emergency Dept', status: 'active', mode: 'instance', org: 'org-mercy', type: 'ER' },
  { id: 'loc-mercy-icu', name: 'Mercy General - ICU', status: 'active', mode: 'instance', org: 'org-mercy', type: 'ICU' },
  { id: 'loc-mercy-gen', name: 'Mercy General - General Ward', status: 'active', mode: 'instance', org: 'org-mercy', type: 'HU' },
  { id: 'loc-cedar-er', name: 'Cedar Valley - Emergency Dept', status: 'active', mode: 'instance', org: 'org-cedar', type: 'ER' },
  { id: 'loc-cedar-out', name: 'Cedar Valley - Outpatient Clinic', status: 'active', mode: 'instance', org: 'org-cedar', type: 'OF' },
  { id: 'loc-beacon-neuro', name: 'Beacon Health - Neurology Center', status: 'active', mode: 'instance', org: 'org-beacon', type: 'OF' },
];

// ── Patients (25) ──
const patientData = [
  { id: 'pat-001', family: 'Thompson', given: 'Margaret', gender: 'female', birthDate: '1955-03-12', city: 'Sacramento', state: 'CA', phone: '916-555-1001', org: 'org-mercy', prac: 'prac-chen' },
  { id: 'pat-002', family: 'Davis', given: 'Robert', gender: 'male', birthDate: '1978-07-24', city: 'Sacramento', state: 'CA', phone: '916-555-1002', org: 'org-mercy', prac: 'prac-okonkwo' },
  { id: 'pat-003', family: 'Martinez', given: 'Isabella', gender: 'female', birthDate: '1990-11-08', city: 'Portland', state: 'OR', phone: '503-555-1003', org: 'org-cedar', prac: 'prac-rodriguez' },
  { id: 'pat-004', family: 'Williams', given: 'James', gender: 'male', birthDate: '1962-01-30', city: 'Portland', state: 'OR', phone: '503-555-1004', org: 'org-cedar', prac: 'prac-johnson' },
  { id: 'pat-005', family: 'Nakamura', given: 'Yuki', gender: 'female', birthDate: '1985-05-17', city: 'Boston', state: 'MA', phone: '617-555-1005', org: 'org-beacon', prac: 'prac-patel' },
  { id: 'pat-006', family: 'Brown', given: 'Charles', gender: 'male', birthDate: '1948-09-03', city: 'Sacramento', state: 'CA', phone: '916-555-1006', org: 'org-mercy', prac: 'prac-chen' },
  { id: 'pat-007', family: 'Garcia', given: 'Sofia', gender: 'female', birthDate: '2001-12-20', city: 'Portland', state: 'OR', phone: '503-555-1007', org: 'org-cedar', prac: 'prac-rodriguez' },
  { id: 'pat-008', family: 'Lee', given: 'Daniel', gender: 'male', birthDate: '1971-04-11', city: 'Boston', state: 'MA', phone: '617-555-1008', org: 'org-beacon', prac: 'prac-kim' },
  { id: 'pat-009', family: 'Anderson', given: 'Patricia', gender: 'female', birthDate: '1958-08-29', city: 'Sacramento', state: 'CA', phone: '916-555-1009', org: 'org-mercy', prac: 'prac-okonkwo' },
  { id: 'pat-010', family: 'Taylor', given: 'Michael', gender: 'male', birthDate: '1993-02-14', city: 'Portland', state: 'OR', phone: '503-555-1010', org: 'org-cedar', prac: 'prac-nguyen' },
  { id: 'pat-011', family: 'Hernandez', given: 'Elena', gender: 'female', birthDate: '1980-06-05', city: 'Boston', state: 'MA', phone: '617-555-1011', org: 'org-beacon', prac: 'prac-patel' },
  { id: 'pat-012', family: 'Moore', given: 'William', gender: 'male', birthDate: '1945-10-18', city: 'Sacramento', state: 'CA', phone: '916-555-1012', org: 'org-mercy', prac: 'prac-brown' },
  { id: 'pat-013', family: 'Clark', given: 'Jennifer', gender: 'female', birthDate: '1997-03-22', city: 'Portland', state: 'OR', phone: '503-555-1013', org: 'org-cedar', prac: 'prac-rodriguez' },
  { id: 'pat-014', family: 'Lewis', given: 'Thomas', gender: 'male', birthDate: '1966-12-07', city: 'Boston', state: 'MA', phone: '617-555-1014', org: 'org-beacon', prac: 'prac-kim' },
  { id: 'pat-015', family: 'Robinson', given: 'Sarah', gender: 'female', birthDate: '1973-09-15', city: 'Sacramento', state: 'CA', phone: '916-555-1015', org: 'org-mercy', prac: 'prac-chen' },
  { id: 'pat-016', family: 'Walker', given: 'Richard', gender: 'male', birthDate: '1988-01-28', city: 'Portland', state: 'OR', phone: '503-555-1016', org: 'org-cedar', prac: 'prac-johnson' },
  { id: 'pat-017', family: 'Hall', given: 'Emily', gender: 'female', birthDate: '2005-07-09', city: 'Boston', state: 'MA', phone: '617-555-1017', org: 'org-beacon', prac: 'prac-patel' },
  { id: 'pat-018', family: 'Allen', given: 'George', gender: 'male', birthDate: '1952-04-02', city: 'Sacramento', state: 'CA', phone: '916-555-1018', org: 'org-mercy', prac: 'prac-okonkwo' },
  { id: 'pat-019', family: 'Young', given: 'Amanda', gender: 'female', birthDate: '1995-11-11', city: 'Portland', state: 'OR', phone: '503-555-1019', org: 'org-cedar', prac: 'prac-nguyen' },
  { id: 'pat-020', family: 'King', given: 'Joseph', gender: 'male', birthDate: '1960-08-20', city: 'Boston', state: 'MA', phone: '617-555-1020', org: 'org-beacon', prac: 'prac-kim' },
  { id: 'pat-021', family: 'Wright', given: 'Lisa', gender: 'female', birthDate: '1983-05-30', city: 'Sacramento', state: 'CA', phone: '916-555-1021', org: 'org-mercy', prac: 'prac-brown' },
  { id: 'pat-022', family: 'Scott', given: 'Kevin', gender: 'male', birthDate: '1976-02-17', city: 'Portland', state: 'OR', phone: '503-555-1022', org: 'org-cedar', prac: 'prac-johnson' },
  { id: 'pat-023', family: 'Green', given: 'Nancy', gender: 'female', birthDate: '1968-10-04', city: 'Boston', state: 'MA', phone: '617-555-1023', org: 'org-beacon', prac: 'prac-patel' },
  { id: 'pat-024', family: 'Baker', given: 'Anthony', gender: 'male', birthDate: '2000-06-13', city: 'Sacramento', state: 'CA', phone: '916-555-1024', org: 'org-mercy', prac: 'prac-chen' },
  { id: 'pat-025', family: 'Adams', given: 'Karen', gender: 'female', birthDate: '1957-01-25', city: 'Portland', state: 'OR', phone: '503-555-1025', org: 'org-cedar', prac: 'prac-rodriguez' },
];

// ── Conditions (ICD-10 mapped) ──
const conditionTemplates = [
  { code: 'I10', display: 'Essential (primary) hypertension', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'J06.9', display: 'Acute upper respiratory infection, unspecified', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'M54.5', display: 'Low back pain', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'F32.1', display: 'Major depressive disorder, single episode, moderate', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'J45.20', display: 'Mild intermittent asthma, uncomplicated', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'I25.10', display: 'Atherosclerotic heart disease of native coronary artery', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'K21.0', display: 'Gastro-esophageal reflux disease with esophagitis', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'G43.909', display: 'Migraine, unspecified, not intractable', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'N39.0', display: 'Urinary tract infection, site not specified', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'E78.5', display: 'Hyperlipidemia, unspecified', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
  { code: 'M79.3', display: 'Panniculitis, unspecified', system: 'http://hl7.org/fhir/sid/icd-10', category: 'encounter-diagnosis' },
];

// ── Medications (RxNorm) ──
const medicationTemplates = [
  { code: '314076', display: 'Lisinopril 10 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '860975', display: 'Metformin 500 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '197361', display: 'Amlodipine 5 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '312961', display: 'Simvastatin 20 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '198211', display: 'Omeprazole 20 MG Delayed Release Oral Capsule', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '310798', display: 'Albuterol 0.83 MG/ML Inhalation Solution', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '372614', display: 'Sertraline 50 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '197591', display: 'Ibuprofen 400 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '314200', display: 'Atorvastatin 10 MG Oral Tablet', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
  { code: '205532', display: 'Amoxicillin 500 MG Oral Capsule', system: 'http://www.nlm.nih.gov/research/umls/rxnorm' },
];

// ── Immunizations ──
const immunizationTemplates = [
  { code: '141', display: 'Influenza, seasonal, injectable' },
  { code: '08', display: 'Hepatitis B vaccine' },
  { code: '21', display: 'Varicella vaccine' },
  { code: '33', display: 'Pneumococcal polysaccharide vaccine, 23 valent' },
  { code: '113', display: 'Td (adult) preservative free' },
  { code: '207', display: 'COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5mL dose' },
  { code: '208', display: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3mL dose' },
  { code: '140', display: 'Influenza, seasonal, injectable, preservative free' },
];

// ── Allergy substances ──
const allergyTemplates = [
  { code: '7980', display: 'Penicillin', reaction: 'Hives', severity: 'moderate' },
  { code: '1191', display: 'Aspirin', reaction: 'Anaphylaxis', severity: 'severe' },
  { code: '2670', display: 'Codeine', reaction: 'Nausea', severity: 'mild' },
  { code: '36437', display: 'Latex', reaction: 'Contact dermatitis', severity: 'moderate' },
  { code: '70618', display: 'Sulfamethoxazole', reaction: 'Rash', severity: 'moderate' },
  { code: '4582', display: 'Erythromycin', reaction: 'GI upset', severity: 'mild' },
];

// ── Procedure templates (CPT-like) ──
const procedureTemplates = [
  { code: '80048', display: 'Basic metabolic panel', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '36415', display: 'Collection of venous blood by venipuncture', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '71046', display: 'Chest X-ray, 2 views', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '93000', display: 'Electrocardiogram, complete', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '99213', display: 'Office visit, established patient, low complexity', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '99214', display: 'Office visit, established patient, moderate complexity', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '27447', display: 'Total knee replacement', system: 'http://www.ama-assn.org/go/cpt' },
  { code: '43239', display: 'Upper GI endoscopy with biopsy', system: 'http://www.ama-assn.org/go/cpt' },
];

// ── Helper: random date in range ──
function randomDate(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0];
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ════════════════════════════════════════
// BUILD FHIR R4-COMPLIANT RESOURCES
// All arrays where FHIR R4 expects arrays
// ════════════════════════════════════════

const db = {};

// Organizations
db.Organization = organizations.map(o => ({
  resourceType: 'Organization',
  id: o.id,
  meta: { versionId: '1', lastUpdated: new Date().toISOString() },
  active: true,
  type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: o.type, display: o.type === 'prov' ? 'Healthcare Provider' : 'Insurance Company' }] }],
  name: o.name,
  telecom: [{ system: 'phone', value: o.phone, use: 'work' }],
  address: [{ city: o.city, state: o.state, country: 'US' }],
}));

// Practitioners
db.Practitioner = practitioners.map(p => ({
  resourceType: 'Practitioner',
  id: p.id,
  meta: { versionId: '1', lastUpdated: new Date().toISOString() },
  active: true,
  name: [{ use: 'official', family: p.family, given: [p.given] }],
  gender: p.gender,
  telecom: [{ system: 'phone', value: p.phone, use: 'work' }],
  qualification: [{ code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD', display: 'Doctor of Medicine' }], text: p.specialty } }],
}));

// Locations
db.Location = locations.map(l => ({
  resourceType: 'Location',
  id: l.id,
  meta: { versionId: '1', lastUpdated: new Date().toISOString() },
  status: l.status,
  name: l.name,
  mode: l.mode,
  type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode', code: l.type }] }],
  managingOrganization: { reference: `Organization/${l.org}` },
}));

// Patients
db.Patient = patientData.map(p => ({
  resourceType: 'Patient',
  id: p.id,
  meta: { versionId: '1', lastUpdated: new Date().toISOString() },
  active: true,
  identifier: [{ system: 'http://hospital.example.org/mrn', value: `MRN-${p.id.split('-')[1]}` }],
  name: [{ use: 'official', family: p.family, given: [p.given] }],
  gender: p.gender,
  birthDate: p.birthDate,
  telecom: [{ system: 'phone', value: p.phone, use: 'home' }],
  address: [{ use: 'home', city: p.city, state: p.state, country: 'US' }],
  managingOrganization: { reference: `Organization/${p.org}` },
  generalPractitioner: [{ reference: `Practitioner/${p.prac}` }],
}));

// Encounters (2-4 per patient)
db.Encounter = [];
const encounterClasses = [
  { code: 'AMB', display: 'ambulatory' },
  { code: 'IMP', display: 'inpatient encounter' },
  { code: 'EMER', display: 'emergency' },
];
const encounterStatuses = ['finished', 'finished', 'finished', 'in-progress', 'planned'];

patientData.forEach(p => {
  const numEnc = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numEnc; i++) {
    const cls = randomPick(encounterClasses);
    const status = randomPick(encounterStatuses);
    const start = randomDate('2023-01-01', '2025-12-31');
    const end = status === 'finished' ? randomDate(start, '2026-01-15') : undefined;
    const orgData = organizations.find(o => o.id === p.org);
    const locOptions = locations.filter(l => l.org === p.org);
    const loc = randomPick(locOptions);
    db.Encounter.push({
      resourceType: 'Encounter',
      id: `enc-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status,
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: cls.code, display: cls.display },
      type: [{ coding: [{ display: `${cls.display} visit` }], text: `${cls.display} visit` }],
      subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      participant: [{ individual: { reference: `Practitioner/${p.prac}` } }],
      period: { start, ...(end && { end }) },
      serviceProvider: { reference: `Organization/${p.org}`, display: orgData.name },
      location: [{ location: { reference: `Location/${loc.id}`, display: loc.name } }],
    });
  }
});

// Conditions (1-3 per patient)
db.Condition = [];
patientData.forEach(p => {
  const numCond = 1 + Math.floor(Math.random() * 3);
  const chosen = [...conditionTemplates].sort(() => Math.random() - 0.5).slice(0, numCond);
  const enc = db.Encounter.find(e => e.subject.reference === `Patient/${p.id}`);
  chosen.forEach((c, i) => {
    db.Condition.push({
      resourceType: 'Condition',
      id: `cond-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }] },
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: c.category, display: 'Encounter Diagnosis' }] }],
      code: { coding: [{ system: c.system, code: c.code, display: c.display }], text: c.display },
      subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      encounter: enc ? { reference: `Encounter/${enc.id}` } : undefined,
      onsetDateTime: randomDate('2020-01-01', '2025-06-01'),
      recordedDate: randomDate('2023-01-01', '2025-12-01'),
    });
  });
});

// Observations (vitals: 3-6 per patient)
db.Observation = [];
const vitalTemplates = [
  { code: '85354-9', display: 'Blood pressure panel', unit: 'mmHg', genValue: () => ({ systolic: 110 + Math.floor(Math.random() * 50), diastolic: 60 + Math.floor(Math.random() * 30) }) },
  { code: '8867-4', display: 'Heart rate', unit: '/min', genValue: () => 60 + Math.floor(Math.random() * 40) },
  { code: '8310-5', display: 'Body temperature', unit: 'Cel', genValue: () => (36 + Math.random() * 2.5).toFixed(1) },
  { code: '29463-7', display: 'Body weight', unit: 'kg', genValue: () => (55 + Math.random() * 50).toFixed(1) },
  { code: '8302-2', display: 'Body height', unit: 'cm', genValue: () => (150 + Math.random() * 35).toFixed(0) },
  { code: '2339-0', display: 'Glucose [Mass/volume] in Blood', unit: 'mg/dL', genValue: () => (70 + Math.random() * 130).toFixed(0) },
  { code: '2093-3', display: 'Total Cholesterol', unit: 'mg/dL', genValue: () => (120 + Math.random() * 140).toFixed(0) },
  { code: '4548-4', display: 'Hemoglobin A1c', unit: '%', genValue: () => (4.5 + Math.random() * 5).toFixed(1) },
  { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum', unit: 'mg/dL', genValue: () => (0.5 + Math.random() * 1.5).toFixed(2) },
];

patientData.forEach(p => {
  const numObs = 3 + Math.floor(Math.random() * 4);
  const chosen = [...vitalTemplates].sort(() => Math.random() - 0.5).slice(0, numObs);
  chosen.forEach((v, i) => {
    const val = v.genValue();
    const obs = {
      resourceType: 'Observation',
      id: `obs-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: v.code, display: v.display }], text: v.display },
      subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      effectiveDateTime: randomDate('2024-01-01', '2025-12-31'),
    };
    if (typeof val === 'object') {
      obs.component = [
        { code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: val.systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: val.diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
      ];
    } else {
      obs.valueQuantity = { value: parseFloat(val), unit: v.unit, system: 'http://unitsofmeasure.org', code: v.unit };
    }
    db.Observation.push(obs);
  });
});

// MedicationRequests (1-3 per patient)
db.MedicationRequest = [];
patientData.forEach(p => {
  const numMed = 1 + Math.floor(Math.random() * 3);
  const chosen = [...medicationTemplates].sort(() => Math.random() - 0.5).slice(0, numMed);
  chosen.forEach((m, i) => {
    db.MedicationRequest.push({
      resourceType: 'MedicationRequest',
      id: `medreq-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status: randomPick(['active', 'active', 'active', 'completed', 'stopped']),
      intent: 'order',
      medicationCodeableConcept: { coding: [{ system: m.system, code: m.code, display: m.display }], text: m.display },
      subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      authoredOn: randomDate('2023-06-01', '2025-12-01'),
      requester: { reference: `Practitioner/${p.prac}` },
      dosageInstruction: [{ text: 'Take as directed', timing: { repeat: { frequency: 1, period: 1, periodUnit: 'd' } } }],
    });
  });
});

// AllergyIntolerances (0-2 per patient)
db.AllergyIntolerance = [];
patientData.forEach(p => {
  const numAll = Math.floor(Math.random() * 3);
  const chosen = [...allergyTemplates].sort(() => Math.random() - 0.5).slice(0, numAll);
  chosen.forEach((a, i) => {
    db.AllergyIntolerance.push({
      resourceType: 'AllergyIntolerance',
      id: `allergy-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
      type: 'allergy',
      category: ['medication'],
      criticality: a.severity === 'severe' ? 'high' : 'low',
      code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: a.code, display: a.display }], text: a.display },
      patient: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      recordedDate: randomDate('2020-01-01', '2025-06-01'),
      reaction: [{ manifestation: [{ coding: [{ display: a.reaction }], text: a.reaction }], severity: a.severity }],
    });
  });
});

// Immunizations (1-3 per patient)
db.Immunization = [];
patientData.forEach(p => {
  const numImm = 1 + Math.floor(Math.random() * 3);
  const chosen = [...immunizationTemplates].sort(() => Math.random() - 0.5).slice(0, numImm);
  chosen.forEach((im, i) => {
    db.Immunization.push({
      resourceType: 'Immunization',
      id: `imm-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status: 'completed',
      vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: im.code, display: im.display }], text: im.display },
      patient: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      occurrenceDateTime: randomDate('2021-01-01', '2025-12-01'),
      performer: [{ actor: { reference: `Practitioner/${p.prac}` } }],
    });
  });
});

// Procedures (1-2 per patient)
db.Procedure = [];
patientData.forEach(p => {
  const numProc = 1 + Math.floor(Math.random() * 2);
  const chosen = [...procedureTemplates].sort(() => Math.random() - 0.5).slice(0, numProc);
  chosen.forEach((pr, i) => {
    const enc = db.Encounter.find(e => e.subject.reference === `Patient/${p.id}` && e.status === 'finished');
    db.Procedure.push({
      resourceType: 'Procedure',
      id: `proc-${p.id.split('-')[1]}-${i + 1}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status: 'completed',
      code: { coding: [{ system: pr.system, code: pr.code, display: pr.display }], text: pr.display },
      subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
      encounter: enc ? { reference: `Encounter/${enc.id}` } : undefined,
      performedDateTime: randomDate('2023-01-01', '2025-12-01'),
      performer: [{ actor: { reference: `Practitioner/${p.prac}` } }],
    });
  });
});

// Appointments
db.Appointment = [];
const apptStatuses = ['booked', 'booked', 'booked', 'arrived', 'fulfilled', 'cancelled'];
patientData.slice(0, 15).forEach((p, idx) => {
  const status = randomPick(apptStatuses);
  const start = randomDate('2025-06-01', '2026-06-01');
  db.Appointment.push({
    resourceType: 'Appointment',
    id: `appt-${p.id.split('-')[1]}`,
    meta: { versionId: '1', lastUpdated: new Date().toISOString() },
    status,
    serviceType: [{ coding: [{ display: randomPick(['General checkup', 'Follow-up', 'Specialist consultation', 'Lab work', 'Annual physical']) }] }],
    start: `${start}T09:00:00Z`,
    end: `${start}T09:30:00Z`,
    minutesDuration: 30,
    participant: [
      { actor: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` }, status: 'accepted' },
      { actor: { reference: `Practitioner/${p.prac}` }, status: 'accepted' },
    ],
  });
});

// DiagnosticReports
db.DiagnosticReport = [];
patientData.slice(0, 12).forEach((p, idx) => {
  db.DiagnosticReport.push({
    resourceType: 'DiagnosticReport',
    id: `diag-${p.id.split('-')[1]}`,
    meta: { versionId: '1', lastUpdated: new Date().toISOString() },
    status: randomPick(['final', 'final', 'preliminary']),
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '58410-2', display: 'Complete blood count (CBC) panel' }], text: 'Complete Blood Count' },
    subject: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
    effectiveDateTime: randomDate('2024-01-01', '2025-12-01'),
    issued: new Date().toISOString(),
    performer: [{ reference: `Practitioner/${p.prac}` }],
    conclusion: randomPick(['All values within normal range', 'Slightly elevated WBC', 'Mild anemia noted', 'Results normal, no action needed']),
  });
});

// Claims
db.Claim = [];
patientData.slice(0, 10).forEach((p, idx) => {
  db.Claim.push({
    resourceType: 'Claim',
    id: `claim-${p.id.split('-')[1]}`,
    meta: { versionId: '1', lastUpdated: new Date().toISOString() },
    status: randomPick(['active', 'active', 'draft']),
    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional', display: 'Professional' }] },
    use: 'claim',
    patient: { reference: `Patient/${p.id}`, display: `${p.given} ${p.family}` },
    created: randomDate('2024-06-01', '2025-12-01'),
    provider: { reference: `Practitioner/${p.prac}` },
    priority: { coding: [{ code: 'normal' }] },
    total: { value: parseFloat((100 + Math.random() * 4900).toFixed(2)), currency: 'USD' },
  });
});

// Write all data files
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

Object.entries(db).forEach(([resourceType, resources]) => {
  const filePath = path.join(dataDir, `${resourceType}.json`);
  fs.writeFileSync(filePath, JSON.stringify(resources, null, 2));
  console.log(`  ✓ ${resourceType}: ${resources.length} resources`);
});

console.log('\n✅ Sample data generated successfully!');
