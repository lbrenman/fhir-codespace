const { Pool } = require('pg');
const crypto = require('crypto');

// ── Table and column mappings per FHIR resource type ──
const TABLE_MAP = {
  Patient: 'fhir_patient',
  Encounter: 'fhir_encounter',
  Condition: 'fhir_condition',
  Observation: 'fhir_observation',
  MedicationRequest: 'fhir_medicationrequest',
  AllergyIntolerance: 'fhir_allergyintolerance',
  Immunization: 'fhir_immunization',
  Procedure: 'fhir_procedure',
  Appointment: 'fhir_appointment',
  Claim: 'fhir_claim',
  DiagnosticReport: 'fhir_diagnosticreport',
  Organization: 'fhir_organization',
  Practitioner: 'fhir_practitioner',
  Location: 'fhir_location',
};

// Extract a FHIR reference ID: { reference: "Patient/pat-001" } → "pat-001"
function refId(ref) {
  return ref?.reference?.split('/')?.[1] || null;
}

// Per-type column extractors (resource → relational columns for INSERT/UPDATE)
const EXTRACTORS = {
  Organization: r => ({
    active: r.active !== false,
    name: r.name,
    type_code: r.type?.[0]?.coding?.[0]?.code,
    type_display: r.type?.[0]?.coding?.[0]?.display,
    phone: r.telecom?.find(t => t.system === 'phone')?.value,
    city: r.address?.[0]?.city,
    state: r.address?.[0]?.state,
    country: r.address?.[0]?.country || 'US',
  }),
  Practitioner: r => ({
    active: r.active !== false,
    family_name: r.name?.[0]?.family,
    given_name: r.name?.[0]?.given?.[0],
    gender: r.gender,
    phone: r.telecom?.find(t => t.system === 'phone')?.value,
    specialty: r.qualification?.[0]?.code?.text,
    qualification_code: r.qualification?.[0]?.code?.coding?.[0]?.code,
  }),
  Location: r => ({
    name: r.name,
    status: r.status || 'active',
    mode: r.mode || 'instance',
    type_code: r.type?.[0]?.coding?.[0]?.code,
    organization_id: refId(r.managingOrganization),
  }),
  Patient: r => ({
    active: r.active !== false,
    family_name: r.name?.[0]?.family,
    given_name: r.name?.[0]?.given?.[0],
    gender: r.gender,
    birth_date: r.birthDate || null,
    mrn: r.identifier?.[0]?.value,
    phone: r.telecom?.find(t => t.system === 'phone')?.value,
    city: r.address?.[0]?.city,
    state: r.address?.[0]?.state,
    country: r.address?.[0]?.country || 'US',
    organization_id: refId(r.managingOrganization),
    general_practitioner_id: refId(r.generalPractitioner?.[0]),
  }),
  Encounter: r => ({
    status: r.status,
    class_code: r.class?.code,
    class_display: r.class?.display,
    type_text: r.type?.[0]?.text,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    practitioner_id: refId(r.participant?.[0]?.individual),
    period_start: r.period?.start || null,
    period_end: r.period?.end || null,
    organization_id: refId(r.serviceProvider),
    location_id: refId(r.location?.[0]?.location),
  }),
  Condition: r => ({
    clinical_status: r.clinicalStatus?.coding?.[0]?.code,
    verification_status: r.verificationStatus?.coding?.[0]?.code,
    category_code: r.category?.[0]?.coding?.[0]?.code,
    code_system: r.code?.coding?.[0]?.system,
    code_code: r.code?.coding?.[0]?.code,
    code_display: r.code?.coding?.[0]?.display,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    encounter_id: refId(r.encounter),
    onset_date: r.onsetDateTime || null,
    recorded_date: r.recordedDate || null,
  }),
  Observation: r => ({
    status: r.status || 'final',
    category_code: r.category?.[0]?.coding?.[0]?.code,
    code_system: r.code?.coding?.[0]?.system,
    code_code: r.code?.coding?.[0]?.code,
    code_display: r.code?.coding?.[0]?.display,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    effective_date: r.effectiveDateTime || null,
    value_quantity: r.valueQuantity?.value ?? null,
    value_unit: r.valueQuantity?.unit,
    value_string: r.valueString,
  }),
  MedicationRequest: r => ({
    status: r.status,
    intent: r.intent || 'order',
    medication_system: r.medicationCodeableConcept?.coding?.[0]?.system,
    medication_code: r.medicationCodeableConcept?.coding?.[0]?.code,
    medication_display: r.medicationCodeableConcept?.coding?.[0]?.display,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    authored_on: r.authoredOn || null,
    requester_id: refId(r.requester),
    dosage_text: r.dosageInstruction?.[0]?.text,
  }),
  AllergyIntolerance: r => ({
    clinical_status: r.clinicalStatus?.coding?.[0]?.code,
    verification_status: r.verificationStatus?.coding?.[0]?.code,
    type: r.type,
    category: r.category?.[0],
    criticality: r.criticality,
    code_system: r.code?.coding?.[0]?.system,
    code_code: r.code?.coding?.[0]?.code,
    code_display: r.code?.coding?.[0]?.display || r.code?.text,
    patient_id: refId(r.patient),
    patient_display: r.patient?.display,
    recorded_date: r.recordedDate || null,
    reaction_manifestation: r.reaction?.[0]?.manifestation?.[0]?.text,
    reaction_severity: r.reaction?.[0]?.severity,
  }),
  Immunization: r => ({
    status: r.status || 'completed',
    vaccine_system: r.vaccineCode?.coding?.[0]?.system,
    vaccine_code: r.vaccineCode?.coding?.[0]?.code,
    vaccine_display: r.vaccineCode?.coding?.[0]?.display,
    patient_id: refId(r.patient),
    patient_display: r.patient?.display,
    occurrence_date: r.occurrenceDateTime || null,
    performer_id: refId(r.performer?.[0]?.actor),
  }),
  Procedure: r => ({
    status: r.status,
    code_system: r.code?.coding?.[0]?.system,
    code_code: r.code?.coding?.[0]?.code,
    code_display: r.code?.coding?.[0]?.display,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    encounter_id: refId(r.encounter),
    performed_date: r.performedDateTime || r.performedPeriod?.start || null,
    performer_id: refId(r.performer?.[0]?.actor),
  }),
  Appointment: r => ({
    status: r.status,
    service_type: r.serviceType?.[0]?.coding?.[0]?.display,
    start_time: r.start || null,
    end_time: r.end || null,
    minutes_duration: r.minutesDuration,
  }),
  Claim: r => ({
    status: r.status,
    type_code: r.type?.coding?.[0]?.code,
    type_display: r.type?.coding?.[0]?.display,
    use: r.use || 'claim',
    patient_id: refId(r.patient),
    patient_display: r.patient?.display,
    created: r.created || null,
    provider_id: refId(r.provider),
    priority: r.priority?.coding?.[0]?.code || 'normal',
    total_value: r.total?.value ?? null,
    total_currency: r.total?.currency || 'USD',
  }),
  DiagnosticReport: r => ({
    status: r.status,
    category_code: r.category?.[0]?.coding?.[0]?.code,
    category_display: r.category?.[0]?.coding?.[0]?.display,
    code_system: r.code?.coding?.[0]?.system,
    code_code: r.code?.coding?.[0]?.code,
    code_display: r.code?.coding?.[0]?.display,
    patient_id: refId(r.subject),
    patient_display: r.subject?.display,
    effective_date: r.effectiveDateTime || null,
    issued: r.issued || null,
    performer_id: refId(r.performer?.[0]),
    conclusion: r.conclusion,
  }),
};

// ── Date fields per resource type (for FHIR date search param) ──
const DATE_COLUMNS = {
  Appointment: 'start_time',
  Encounter: 'period_start',
  Observation: 'effective_date',
  Condition: 'onset_date',
  Procedure: 'performed_date',
  MedicationRequest: 'authored_on',
  Immunization: 'occurrence_date',
  DiagnosticReport: 'effective_date',
  Claim: 'created',
  AllergyIntolerance: 'recorded_date',
};

// ── Patient reference column per resource type ──
const PATIENT_COLUMNS = {
  Encounter: 'patient_id', Observation: 'patient_id', Condition: 'patient_id',
  Procedure: 'patient_id', MedicationRequest: 'patient_id', DiagnosticReport: 'patient_id',
  AllergyIntolerance: 'patient_id', Immunization: 'patient_id',
  Claim: 'patient_id', Appointment: '_participant',
};

class FhirStorePg {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon') ? { rejectUnauthorized: false } : undefined,
    });
    console.log('  PostgreSQL store connected');
  }

  // ── Search ──
  async search(resourceType, queryParams = {}) {
    const table = TABLE_MAP[resourceType];
    if (!table) return { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] };

    const conditions = [];
    const values = [];
    let paramIdx = 0;

    for (const [key, rawValue] of Object.entries(queryParams)) {
      if (key.startsWith('_')) continue;
      const vals = Array.isArray(rawValue) ? rawValue : [rawValue];

      // ── Date search ──
      if (key === 'date') {
        const dateCol = DATE_COLUMNS[resourceType];
        if (dateCol) {
          for (const val of vals) {
            const { prefix, dateStr } = this._parseDateParam(val);
            paramIdx++;
            values.push(dateStr);
            const ops = { eq: '=', ge: '>=', le: '<=', gt: '>', lt: '<' };
            conditions.push(`${dateCol} ${ops[prefix] || '>='} $${paramIdx}`);
          }
          continue;
        }
      }

      // ── Patient/subject search ──
      if (key === 'patient' || key === 'subject') {
        const patCol = PATIENT_COLUMNS[resourceType];
        if (patCol && patCol !== '_participant') {
          for (const val of vals) {
            const patId = val.startsWith('Patient/') ? val.split('/')[1] : val;
            // Check if it's an exact ID by looking for typical ID patterns
            paramIdx++;
            if (/^pat-\d+$/.test(patId) || /^[a-f0-9]{8,}$/.test(patId)) {
              values.push(patId);
              conditions.push(`${patCol} = $${paramIdx}`);
            } else {
              // Name search against patient_display
              values.push(`%${patId}%`);
              conditions.push(`patient_display ILIKE $${paramIdx}`);
            }
          }
          continue;
        }
        // Appointment: join to participant table
        if (patCol === '_participant') {
          for (const val of vals) {
            const patId = val.startsWith('Patient/') ? val : `Patient/${val}`;
            paramIdx++;
            values.push(patId);
            conditions.push(`id IN (SELECT appointment_id FROM fhir_appointment_participant WHERE actor_reference = $${paramIdx})`);
          }
          continue;
        }
      }

      // ── Status search ──
      if (key === 'status') {
        for (const val of vals) {
          paramIdx++;
          values.push(val);
          conditions.push(`status = $${paramIdx}`);
        }
        continue;
      }

      // ── Fallback: JSONB text search ──
      for (const val of vals) {
        paramIdx++;
        values.push(`%${val}%`);
        conditions.push(`resource_json::TEXT ILIKE $${paramIdx}`);
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const count = parseInt(queryParams._count) || 100;
    const offset = parseInt(queryParams._offset) || 0;

    const countResult = await this.pool.query(
      `SELECT COUNT(*) AS total FROM ${table} ${where}`, values
    );
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await this.pool.query(
      `SELECT id, resource_json FROM ${table} ${where} ORDER BY last_updated DESC LIMIT ${count} OFFSET ${offset}`,
      values
    );

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total,
      entry: dataResult.rows.map(row => ({
        fullUrl: `${resourceType}/${row.id}`,
        resource: row.resource_json,
      })),
    };
  }

  // ── Read ──
  async read(resourceType, id) {
    const table = TABLE_MAP[resourceType];
    if (!table) return null;
    const result = await this.pool.query(
      `SELECT resource_json FROM ${table} WHERE id = $1`, [id]
    );
    return result.rows[0]?.resource_json || null;
  }

  // ── Create ──
  async create(resourceType, resource) {
    const table = TABLE_MAP[resourceType];
    if (!table) throw new Error(`Unknown resource type: ${resourceType}`);

    const id = resource.id || crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const now = new Date().toISOString();
    resource.id = id;
    resource.resourceType = resourceType;
    resource.meta = { versionId: '1', lastUpdated: now };

    const extractor = EXTRACTORS[resourceType];
    const cols = extractor ? extractor(resource) : {};

    const allCols = { id, ...cols, version_id: '1', last_updated: now, resource_json: JSON.stringify(resource) };
    const keys = Object.keys(allCols);
    const vals = Object.values(allCols);
    const placeholders = keys.map((_, i) => {
      if (keys[i] === 'resource_json') return `$${i + 1}::JSONB`;
      return `$${i + 1}`;
    });

    await this.pool.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`,
      vals
    );

    // Handle child tables
    if (resourceType === 'Appointment' && resource.participant) {
      for (const p of resource.participant) {
        const ref = p.actor?.reference || '';
        const actorType = ref.split('/')[0] || 'Unknown';
        await this.pool.query(
          `INSERT INTO fhir_appointment_participant (appointment_id, actor_reference, actor_display, actor_type, status) VALUES ($1, $2, $3, $4, $5)`,
          [id, ref, p.actor?.display, actorType, p.status || 'accepted']
        );
      }
    }

    if (resourceType === 'Observation' && resource.component) {
      for (const c of resource.component) {
        await this.pool.query(
          `INSERT INTO fhir_observation_component (observation_id, code_system, code_code, code_display, value_quantity, value_unit) VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, c.code?.coding?.[0]?.system, c.code?.coding?.[0]?.code, c.code?.coding?.[0]?.display, c.valueQuantity?.value, c.valueQuantity?.unit]
        );
      }
    }

    return resource;
  }

  // ── Update ──
  async update(resourceType, id, resource) {
    const table = TABLE_MAP[resourceType];
    if (!table) throw new Error(`Unknown resource type: ${resourceType}`);

    // Get current version
    const current = await this.read(resourceType, id);
    const isNew = !current;

    if (isNew) {
      // Upsert: create if not exists
      resource.id = id;
      const created = await this.create(resourceType, resource);
      return { resource: created, created: true };
    }

    const now = new Date().toISOString();
    const newVersion = String(parseInt(current.meta?.versionId || '0') + 1);
    resource.id = id;
    resource.resourceType = resourceType;
    resource.meta = { versionId: newVersion, lastUpdated: now };

    const extractor = EXTRACTORS[resourceType];
    const cols = extractor ? extractor(resource) : {};
    cols.version_id = newVersion;
    cols.last_updated = now;
    cols.resource_json = JSON.stringify(resource);

    const keys = Object.keys(cols);
    const vals = Object.values(cols);
    const setClause = keys.map((k, i) => {
      if (k === 'resource_json') return `${k} = $${i + 1}::JSONB`;
      return `${k} = $${i + 1}`;
    }).join(', ');

    vals.push(id);
    await this.pool.query(
      `UPDATE ${table} SET ${setClause} WHERE id = $${vals.length}`, vals
    );

    // Rebuild child tables
    if (resourceType === 'Appointment') {
      await this.pool.query(`DELETE FROM fhir_appointment_participant WHERE appointment_id = $1`, [id]);
      if (resource.participant) {
        for (const p of resource.participant) {
          const ref = p.actor?.reference || '';
          const actorType = ref.split('/')[0] || 'Unknown';
          await this.pool.query(
            `INSERT INTO fhir_appointment_participant (appointment_id, actor_reference, actor_display, actor_type, status) VALUES ($1, $2, $3, $4, $5)`,
            [id, ref, p.actor?.display, actorType, p.status || 'accepted']
          );
        }
      }
    }

    if (resourceType === 'Observation') {
      await this.pool.query(`DELETE FROM fhir_observation_component WHERE observation_id = $1`, [id]);
      if (resource.component) {
        for (const c of resource.component) {
          await this.pool.query(
            `INSERT INTO fhir_observation_component (observation_id, code_system, code_code, code_display, value_quantity, value_unit) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, c.code?.coding?.[0]?.system, c.code?.coding?.[0]?.code, c.code?.coding?.[0]?.display, c.valueQuantity?.value, c.valueQuantity?.unit]
          );
        }
      }
    }

    return { resource, created: false };
  }

  // ── Delete ──
  async delete(resourceType, id) {
    const table = TABLE_MAP[resourceType];
    if (!table) return false;
    // Child tables cascade via ON DELETE CASCADE
    const result = await this.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }

  // ── Stats ──
  async getStats() {
    const stats = {};
    for (const [type, table] of Object.entries(TABLE_MAP)) {
      const result = await this.pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
      stats[type] = { count: parseInt(result.rows[0].c) };
    }
    return stats;
  }

  // ── Helper: parse FHIR date prefix ──
  _parseDateParam(val) {
    const prefixes = ['ge', 'le', 'gt', 'lt', 'eq'];
    for (const p of prefixes) {
      if (val.startsWith(p)) return { prefix: p, dateStr: val.slice(2) };
    }
    return { prefix: 'eq', dateStr: val };
  }
}

module.exports = new FhirStorePg();
