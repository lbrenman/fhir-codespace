const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');

class FhirStore {
  constructor() {
    this.resources = {};
    this._loadFromDisk();
  }

  _loadFromDisk() {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('⚠ No data directory found. Run: npm run seed');
      return;
    }
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const type = file.replace('.json', '');
      try {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
        const arr = JSON.parse(raw);
        this.resources[type] = {};
        for (const r of arr) {
          this.resources[type][r.id] = r;
        }
        console.log(`  Loaded ${arr.length} ${type} resources`);
      } catch (e) {
        console.error(`  Error loading ${file}:`, e.message);
      }
    }
  }

  _saveToDisk(resourceType) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const arr = Object.values(this.resources[resourceType] || {});
    fs.writeFileSync(
      path.join(DATA_DIR, `${resourceType}.json`),
      JSON.stringify(arr, null, 2)
    );
  }

  // Search (GET /<ResourceType>)
  search(resourceType, queryParams = {}) {
    const bucket = this.resources[resourceType];
    if (!bucket) return { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] };
    let results = Object.values(bucket);

    // ── FHIR date field mapping per resource type ──
    const DATE_FIELDS = {
      Appointment: ['start'],
      Encounter: ['period.start'],
      Observation: ['effectiveDateTime'],
      Condition: ['onsetDateTime','recordedDate'],
      Procedure: ['performedDateTime','performedPeriod.start'],
      MedicationRequest: ['authoredOn'],
      Immunization: ['occurrenceDateTime'],
      DiagnosticReport: ['effectiveDateTime','issued'],
      Claim: ['created'],
      AllergyIntolerance: ['recordedDate'],
    };

    // ── FHIR patient/subject reference field mapping ──
    const PATIENT_FIELDS = {
      Encounter: 'subject', Observation: 'subject', Condition: 'subject',
      Procedure: 'subject', MedicationRequest: 'subject', DiagnosticReport: 'subject',
      AllergyIntolerance: 'patient', Immunization: 'patient', Appointment: '_participant',
      Claim: 'patient',
    };

    // Helper: resolve nested dot-path (e.g. "period.start")
    const getField = (obj, path) => {
      return path.split('.').reduce((o, k) => o?.[k], obj);
    };

    // Helper: parse FHIR date prefix (ge2026-06-01 → { prefix: 'ge', date: Date })
    const parseDateParam = (val) => {
      const prefixes = ['ge','le','gt','lt','eq'];
      for (const p of prefixes) {
        if (val.startsWith(p)) return { prefix: p, date: new Date(val.slice(2)) };
      }
      return { prefix: 'eq', date: new Date(val) };
    };

    // Helper: compare a resource date value against a FHIR date condition
    const matchesDate = (resourceDateStr, prefix, targetDate) => {
      if (!resourceDateStr) return false;
      const rd = new Date(resourceDateStr).getTime();
      const td = targetDate.getTime();
      if (isNaN(rd) || isNaN(td)) return false;
      switch (prefix) {
        case 'eq': return rd >= td && rd < td + 86400000; // same day
        case 'ge': return rd >= td;
        case 'le': return rd <= td;
        case 'gt': return rd > td;
        case 'lt': return rd < td;
        default: return true;
      }
    };

    // Process query params
    for (const [key, rawValue] of Object.entries(queryParams)) {
      if (key.startsWith('_')) continue; // skip _count, _offset, etc.

      // Support repeated params: ?date=ge...&date=le... comes as array or string
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];

      // ── Date search parameter ──
      if (key === 'date') {
        const dateFields = DATE_FIELDS[resourceType];
        if (dateFields) {
          for (const val of values) {
            const { prefix, date } = parseDateParam(val);
            if (!isNaN(date.getTime())) {
              results = results.filter(r =>
                dateFields.some(f => matchesDate(getField(r, f), prefix, date))
              );
            }
          }
          continue;
        }
      }

      // ── Patient/subject search parameter ──
      if (key === 'patient' || key === 'subject') {
        const field = PATIENT_FIELDS[resourceType];
        if (field) {
          for (const val of values) {
            const ref = val.startsWith('Patient/') ? val : `Patient/${val}`;
            results = results.filter(r => {
              if (field === '_participant') {
                // Appointment uses participant array
                return (r.participant || []).some(p => p.actor?.reference === ref);
              }
              return r[field]?.reference === ref;
            });
          }
          continue;
        }
      }

      // ── Status search parameter ──
      if (key === 'status') {
        for (const val of values) {
          results = results.filter(r => r.status === val);
        }
        continue;
      }

      // ── Fallback: generic text search ──
      for (const val of values) {
        results = results.filter(r => JSON.stringify(r).toLowerCase().includes(val.toLowerCase()));
      }
    }

    // Pagination
    const count = parseInt(queryParams._count) || 100;
    const offset = parseInt(queryParams._offset) || 0;
    const paged = results.slice(offset, offset + count);

    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: results.length,
      entry: paged.map(r => ({
        fullUrl: `${resourceType}/${r.id}`,
        resource: r,
      })),
    };
  }

  // Read (GET /<ResourceType>/<id>)
  read(resourceType, id) {
    const bucket = this.resources[resourceType];
    if (!bucket || !bucket[id]) return null;
    return bucket[id];
  }

  // Create (POST /<ResourceType>)
  create(resourceType, resource) {
    if (!this.resources[resourceType]) {
      this.resources[resourceType] = {};
    }
    const id = resource.id || crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    resource.id = id;
    resource.resourceType = resourceType;
    resource.meta = {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
    };
    this.resources[resourceType][id] = resource;
    this._saveToDisk(resourceType);
    return resource;
  }

  // Update (PUT /<ResourceType>/<id>)
  update(resourceType, id, resource) {
    if (!this.resources[resourceType]) {
      this.resources[resourceType] = {};
    }
    const existing = this.resources[resourceType][id];
    const versionId = existing
      ? String(parseInt(existing.meta?.versionId || '0') + 1)
      : '1';

    resource.id = id;
    resource.resourceType = resourceType;
    resource.meta = {
      versionId,
      lastUpdated: new Date().toISOString(),
    };
    this.resources[resourceType][id] = resource;
    this._saveToDisk(resourceType);
    return { resource, created: !existing };
  }

  // Delete (DELETE /<ResourceType>/<id>)
  delete(resourceType, id) {
    const bucket = this.resources[resourceType];
    if (!bucket || !bucket[id]) return false;
    delete bucket[id];
    this._saveToDisk(resourceType);
    return true;
  }

  // Get all resource type names
  getResourceTypes() {
    return Object.keys(this.resources);
  }

  // Get summary stats
  getStats() {
    const stats = {};
    for (const [type, bucket] of Object.entries(this.resources)) {
      stats[type] = { count: Object.keys(bucket).length };
    }
    return stats;
  }
}

module.exports = new FhirStore();
