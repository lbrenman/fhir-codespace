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

    // Basic search parameter filtering
    for (const [key, value] of Object.entries(queryParams)) {
      if (key.startsWith('_')) continue; // skip special params
      results = results.filter(r => {
        return JSON.stringify(r).toLowerCase().includes(value.toLowerCase());
      });
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
