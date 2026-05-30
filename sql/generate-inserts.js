#!/usr/bin/env node
// ============================================================
// Generates 003-seed-data.sql from the FHIR JSON data files
// Usage: node generate-inserts.js > 003-seed-data.sql
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'server', 'data');

function load(type) {
  const file = path.join(DATA_DIR, `${type}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// Escape single quotes for SQL
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const jsonEsc = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::JSONB`;

function extractRef(ref) {
  if (!ref?.reference) return null;
  return ref.reference.split('/')[1] || null;
}

const out = [];
const emit = (s) => out.push(s);

emit('-- ============================================================');
emit('-- FHIR R4 Seed Data (auto-generated from JSON)');
emit('-- Run after 001-schema.sql');
emit('-- ============================================================');
emit('');
emit('BEGIN;');
emit('');

// ── Organizations ──
emit('-- Organizations');
for (const r of load('Organization')) {
  const t = r.type?.[0]?.coding?.[0];
  const addr = r.address?.[0];
  const phone = r.telecom?.find(t => t.system === 'phone')?.value;
  emit(`INSERT INTO FHIR_Organization (id, active, name, type_code, type_display, phone, city, state, country, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.active !== false)}, ${esc(r.name)}, ${esc(t?.code)}, ${esc(t?.display)}, ${esc(phone)}, ${esc(addr?.city)}, ${esc(addr?.state)}, ${esc(addr?.country || 'US')}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Practitioners ──
emit('-- Practitioners');
for (const r of load('Practitioner')) {
  const n = r.name?.[0];
  const phone = r.telecom?.find(t => t.system === 'phone')?.value;
  const qual = r.qualification?.[0];
  emit(`INSERT INTO FHIR_Practitioner (id, active, family_name, given_name, gender, phone, specialty, qualification_code, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.active !== false)}, ${esc(n?.family)}, ${esc(n?.given?.[0])}, ${esc(r.gender)}, ${esc(phone)}, ${esc(qual?.code?.text)}, ${esc(qual?.code?.coding?.[0]?.code)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Locations ──
emit('-- Locations');
for (const r of load('Location')) {
  const t = r.type?.[0]?.coding?.[0];
  emit(`INSERT INTO FHIR_Location (id, name, status, mode, type_code, organization_id, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.status)}, ${esc(r.mode)}, ${esc(t?.code)}, ${esc(extractRef(r.managingOrganization))}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Patients ──
emit('-- Patients');
for (const r of load('Patient')) {
  const n = r.name?.[0];
  const addr = r.address?.[0];
  const phone = r.telecom?.find(t => t.system === 'phone')?.value;
  const mrn = r.identifier?.[0]?.value;
  emit(`INSERT INTO FHIR_Patient (id, active, family_name, given_name, gender, birth_date, mrn, phone, city, state, country, organization_id, general_practitioner_id, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.active !== false)}, ${esc(n?.family)}, ${esc(n?.given?.[0])}, ${esc(r.gender)}, ${esc(r.birthDate)}, ${esc(mrn)}, ${esc(phone)}, ${esc(addr?.city)}, ${esc(addr?.state)}, ${esc(addr?.country || 'US')}, ${esc(extractRef(r.managingOrganization))}, ${esc(extractRef(r.generalPractitioner?.[0]))}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Encounters ──
emit('-- Encounters');
for (const r of load('Encounter')) {
  emit(`INSERT INTO FHIR_Encounter (id, status, class_code, class_display, type_text, patient_id, patient_display, practitioner_id, period_start, period_end, organization_id, location_id, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.class?.code)}, ${esc(r.class?.display)}, ${esc(r.type?.[0]?.text)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(extractRef(r.participant?.[0]?.individual))}, ${esc(r.period?.start)}, ${esc(r.period?.end)}, ${esc(extractRef(r.serviceProvider))}, ${esc(extractRef(r.location?.[0]?.location))}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Conditions ──
emit('-- Conditions');
for (const r of load('Condition')) {
  emit(`INSERT INTO FHIR_Condition (id, clinical_status, verification_status, category_code, code_system, code_code, code_display, patient_id, patient_display, encounter_id, onset_date, recorded_date, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.clinicalStatus?.coding?.[0]?.code)}, ${esc(r.verificationStatus?.coding?.[0]?.code)}, ${esc(r.category?.[0]?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.system)}, ${esc(r.code?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.display)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(extractRef(r.encounter))}, ${esc(r.onsetDateTime)}, ${esc(r.recordedDate)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Observations (with components for BP) ──
emit('-- Observations');
const observations = load('Observation');
for (const r of observations) {
  emit(`INSERT INTO FHIR_Observation (id, status, category_code, code_system, code_code, code_display, patient_id, patient_display, effective_date, value_quantity, value_unit, value_string, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.category?.[0]?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.system)}, ${esc(r.code?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.display)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(r.effectiveDateTime)}, ${r.valueQuantity ? esc(r.valueQuantity.value) : 'NULL'}, ${r.valueQuantity ? esc(r.valueQuantity.unit) : 'NULL'}, ${esc(r.valueString)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

emit('-- Observation Components (blood pressure systolic/diastolic)');
for (const r of observations) {
  if (!r.component) continue;
  for (const c of r.component) {
    emit(`INSERT INTO FHIR_Observation_Component (observation_id, code_system, code_code, code_display, value_quantity, value_unit) VALUES (${esc(r.id)}, ${esc(c.code?.coding?.[0]?.system)}, ${esc(c.code?.coding?.[0]?.code)}, ${esc(c.code?.coding?.[0]?.display)}, ${c.valueQuantity ? esc(c.valueQuantity.value) : 'NULL'}, ${c.valueQuantity ? esc(c.valueQuantity.unit) : 'NULL'});`);
  }
}
emit('');

// ── MedicationRequests ──
emit('-- MedicationRequests');
for (const r of load('MedicationRequest')) {
  const med = r.medicationCodeableConcept;
  emit(`INSERT INTO FHIR_MedicationRequest (id, status, intent, medication_system, medication_code, medication_display, patient_id, patient_display, authored_on, requester_id, dosage_text, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.intent)}, ${esc(med?.coding?.[0]?.system)}, ${esc(med?.coding?.[0]?.code)}, ${esc(med?.coding?.[0]?.display)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(r.authoredOn)}, ${esc(extractRef(r.requester))}, ${esc(r.dosageInstruction?.[0]?.text)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── AllergyIntolerance ──
emit('-- AllergyIntolerances');
for (const r of load('AllergyIntolerance')) {
  const rx = r.reaction?.[0];
  emit(`INSERT INTO FHIR_AllergyIntolerance (id, clinical_status, verification_status, type, category, criticality, code_system, code_code, code_display, patient_id, patient_display, recorded_date, reaction_manifestation, reaction_severity, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.clinicalStatus?.coding?.[0]?.code)}, ${esc(r.verificationStatus?.coding?.[0]?.code)}, ${esc(r.type)}, ${esc(r.category?.[0])}, ${esc(r.criticality)}, ${esc(r.code?.coding?.[0]?.system)}, ${esc(r.code?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.display)}, ${esc(extractRef(r.patient))}, ${esc(r.patient?.display)}, ${esc(r.recordedDate)}, ${esc(rx?.manifestation?.[0]?.text)}, ${esc(rx?.severity)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Immunizations ──
emit('-- Immunizations');
for (const r of load('Immunization')) {
  emit(`INSERT INTO FHIR_Immunization (id, status, vaccine_system, vaccine_code, vaccine_display, patient_id, patient_display, occurrence_date, performer_id, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.vaccineCode?.coding?.[0]?.system)}, ${esc(r.vaccineCode?.coding?.[0]?.code)}, ${esc(r.vaccineCode?.coding?.[0]?.display)}, ${esc(extractRef(r.patient))}, ${esc(r.patient?.display)}, ${esc(r.occurrenceDateTime)}, ${esc(extractRef(r.performer?.[0]?.actor))}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Procedures ──
emit('-- Procedures');
for (const r of load('Procedure')) {
  emit(`INSERT INTO FHIR_Procedure (id, status, code_system, code_code, code_display, patient_id, patient_display, encounter_id, performed_date, performer_id, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.code?.coding?.[0]?.system)}, ${esc(r.code?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.display)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(extractRef(r.encounter))}, ${esc(r.performedDateTime)}, ${esc(extractRef(r.performer?.[0]?.actor))}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── Appointments + Participants ──
emit('-- Appointments');
for (const r of load('Appointment')) {
  const svc = r.serviceType?.[0]?.coding?.[0]?.display;
  emit(`INSERT INTO FHIR_Appointment (id, status, service_type, start_time, end_time, minutes_duration, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(svc)}, ${esc(r.start)}, ${esc(r.end)}, ${r.minutesDuration || 'NULL'}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);

  if (r.participant) {
    for (const p of r.participant) {
      const ref = p.actor?.reference || '';
      const actorType = ref.split('/')[0] || 'Unknown';
      emit(`INSERT INTO FHIR_Appointment_Participant (appointment_id, actor_reference, actor_display, actor_type, status) VALUES (${esc(r.id)}, ${esc(ref)}, ${esc(p.actor?.display)}, ${esc(actorType)}, ${esc(p.status)});`);
    }
  }
}
emit('');

// ── Claims ──
emit('-- Claims');
for (const r of load('Claim')) {
  emit(`INSERT INTO FHIR_Claim (id, status, type_code, type_display, use, patient_id, patient_display, created, provider_id, priority, total_value, total_currency, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.type?.coding?.[0]?.code)}, ${esc(r.type?.coding?.[0]?.display)}, ${esc(r.use)}, ${esc(extractRef(r.patient))}, ${esc(r.patient?.display)}, ${esc(r.created)}, ${esc(extractRef(r.provider))}, ${esc(r.priority?.coding?.[0]?.code)}, ${r.total?.value != null ? esc(r.total.value) : 'NULL'}, ${esc(r.total?.currency || 'USD')}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

// ── DiagnosticReports ──
emit('-- DiagnosticReports');
for (const r of load('DiagnosticReport')) {
  emit(`INSERT INTO FHIR_DiagnosticReport (id, status, category_code, category_display, code_system, code_code, code_display, patient_id, patient_display, effective_date, issued, performer_id, conclusion, version_id, last_updated, resource_json) VALUES (${esc(r.id)}, ${esc(r.status)}, ${esc(r.category?.[0]?.coding?.[0]?.code)}, ${esc(r.category?.[0]?.coding?.[0]?.display)}, ${esc(r.code?.coding?.[0]?.system)}, ${esc(r.code?.coding?.[0]?.code)}, ${esc(r.code?.coding?.[0]?.display)}, ${esc(extractRef(r.subject))}, ${esc(r.subject?.display)}, ${esc(r.effectiveDateTime)}, ${esc(r.issued)}, ${esc(extractRef(r.performer?.[0]))}, ${esc(r.conclusion)}, ${esc(r.meta?.versionId)}, ${esc(r.meta?.lastUpdated)}, ${jsonEsc(r)});`);
}
emit('');

emit('COMMIT;');
emit('');

// Summary
const counts = {
  Organization: load('Organization').length,
  Practitioner: load('Practitioner').length,
  Location: load('Location').length,
  Patient: load('Patient').length,
  Encounter: load('Encounter').length,
  Condition: load('Condition').length,
  Observation: observations.length,
  'Observation_Component': observations.reduce((s, o) => s + (o.component?.length || 0), 0),
  MedicationRequest: load('MedicationRequest').length,
  AllergyIntolerance: load('AllergyIntolerance').length,
  Immunization: load('Immunization').length,
  Procedure: load('Procedure').length,
  Appointment: load('Appointment').length,
  Claim: load('Claim').length,
  DiagnosticReport: load('DiagnosticReport').length,
};
const total = Object.values(counts).reduce((s, v) => s + v, 0);
emit(`-- ════════════════════════════════════════`);
emit(`-- Seed data summary: ${total} rows total`);
for (const [k, v] of Object.entries(counts)) {
  emit(`--   FHIR_${k}: ${v}`);
}
emit(`-- ════════════════════════════════════════`);

// Write to stdout
process.stdout.write(out.join('\n') + '\n');
