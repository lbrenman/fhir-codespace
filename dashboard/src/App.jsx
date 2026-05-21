import { useState, useEffect, useCallback, useRef } from 'react';
import { fhir } from './api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

/* ── Icon SVGs (inline to avoid deps) ── */
const Icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
  clipboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
  ),
  heart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  ),
  pill: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  dollar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  building: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/></svg>
  ),
  stethoscope: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 0012 0V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  fileText: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  syringe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4"/><path d="M17 7l3-3"/><path d="M19 9l-8.7 8.7c-.4.4-1 .4-1.4 0L5.3 14.1c-.4-.4-.4-1 0-1.4L14 4"/><path d="M5 14l-2 2"/><path d="M7 17l-3 3"/></svg>
  ),
  scissors: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
  ),
};

const RESOURCE_NAV = [
  { key: 'Patient', label: 'Patients', icon: Icons.users, color: 'blue' },
  { key: 'Encounter', label: 'Encounters', icon: Icons.activity, color: 'green' },
  { key: 'Condition', label: 'Conditions', icon: Icons.heart, color: 'red' },
  { key: 'Observation', label: 'Observations', icon: Icons.clipboard, color: 'cyan' },
  { key: 'MedicationRequest', label: 'Medications', icon: Icons.pill, color: 'purple' },
  { key: 'AllergyIntolerance', label: 'Allergies', icon: Icons.shield, color: 'amber' },
  { key: 'Immunization', label: 'Immunizations', icon: Icons.syringe, color: 'green' },
  { key: 'Procedure', label: 'Procedures', icon: Icons.scissors, color: 'cyan' },
  { key: 'Appointment', label: 'Appointments', icon: Icons.calendar, color: 'blue' },
  { key: 'Claim', label: 'Claims', icon: Icons.dollar, color: 'amber' },
  { key: 'DiagnosticReport', label: 'Diagnostics', icon: Icons.fileText, color: 'purple' },
  { key: 'Organization', label: 'Organizations', icon: Icons.building, color: 'blue' },
  { key: 'Practitioner', label: 'Practitioners', icon: Icons.stethoscope, color: 'green' },
  { key: 'Location', label: 'Locations', icon: Icons.mapPin, color: 'red' },
];

const CHART_COLORS = ['#4f8fff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb923c', '#e879f9'];

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2235', border: '1px solid #2a3550', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
      <div style={{ color: '#8895aa', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e8ecf4' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

/* ── Resource Display Helpers ── */
function getPatientName(p) {
  if (!p?.name?.[0]) return 'Unknown';
  const n = p.name[0];
  return [n.prefix?.[0], n.given?.join(' '), n.family].filter(Boolean).join(' ');
}

function getPractitionerName(p) {
  if (!p?.name?.[0]) return 'Unknown';
  const n = p.name[0];
  return [n.prefix?.[0], n.given?.join(' '), n.family].filter(Boolean).join(' ');
}

function getDisplayText(cc) {
  if (!cc) return '—';
  return cc.text || cc.coding?.[0]?.display || cc.coding?.[0]?.code || '—';
}

function getStatusBadge(status) {
  if (!status) return null;
  const map = {
    active: 'green', completed: 'blue', 'in-progress': 'amber', cancelled: 'red',
    draft: 'amber', finished: 'green', arrived: 'blue', triaged: 'amber',
    planned: 'blue', booked: 'blue', pending: 'amber', fulfilled: 'green',
    confirmed: 'green', final: 'green', preliminary: 'amber',
  };
  return <span className={`badge badge-${map[status] || 'blue'}`}>{status}</span>;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

/* ── RESOURCE TABLE CONFIGS ── */
const TABLE_CONFIGS = {
  Patient: {
    columns: ['Name', 'Gender', 'Birth Date', 'Identifier', 'Status'],
    row: (r) => [
      getPatientName(r),
      r.gender || '—',
      formatDate(r.birthDate),
      r.identifier?.[0]?.value || '—',
      getStatusBadge(r.active !== false ? 'active' : 'cancelled'),
    ],
  },
  Encounter: {
    columns: ['Patient', 'Class', 'Type', 'Status', 'Period Start'],
    row: (r) => [
      r.subject?.display || r.subject?.reference || '—',
      r.class?.display || r.class?.code || '—',
      getDisplayText(r.type?.[0]),
      getStatusBadge(r.status),
      formatDate(r.period?.start),
    ],
  },
  Condition: {
    columns: ['Patient', 'Condition', 'Clinical Status', 'Severity', 'Onset'],
    row: (r) => [
      r.subject?.display || '—',
      getDisplayText(r.code),
      getDisplayText(r.clinicalStatus),
      getDisplayText(r.severity),
      formatDate(r.onsetDateTime),
    ],
  },
  Observation: {
    columns: ['Patient', 'Observation', 'Value', 'Status', 'Date'],
    row: (r) => [
      r.subject?.display || '—',
      getDisplayText(r.code),
      r.valueQuantity ? `${r.valueQuantity.value} ${r.valueQuantity.unit || ''}` : r.valueString || '—',
      getStatusBadge(r.status),
      formatDate(r.effectiveDateTime),
    ],
  },
  MedicationRequest: {
    columns: ['Patient', 'Medication', 'Status', 'Intent', 'Authored On'],
    row: (r) => [
      r.subject?.display || '—',
      getDisplayText(r.medicationCodeableConcept),
      getStatusBadge(r.status),
      r.intent || '—',
      formatDate(r.authoredOn),
    ],
  },
  AllergyIntolerance: {
    columns: ['Patient', 'Substance', 'Category', 'Criticality', 'Status'],
    row: (r) => [
      r.patient?.display || '—',
      getDisplayText(r.code),
      r.category?.join(', ') || '—',
      r.criticality || '—',
      getStatusBadge(r.clinicalStatus?.coding?.[0]?.code),
    ],
  },
  Immunization: {
    columns: ['Patient', 'Vaccine', 'Status', 'Date', 'Dose'],
    row: (r) => [
      r.patient?.display || '—',
      getDisplayText(r.vaccineCode),
      getStatusBadge(r.status),
      formatDate(r.occurrenceDateTime),
      r.protocolApplied?.[0]?.doseNumberPositiveInt || '—',
    ],
  },
  Procedure: {
    columns: ['Patient', 'Procedure', 'Status', 'Date', 'Performer'],
    row: (r) => [
      r.subject?.display || '—',
      getDisplayText(r.code),
      getStatusBadge(r.status),
      formatDate(r.performedDateTime || r.performedPeriod?.start),
      r.performer?.[0]?.actor?.display || '—',
    ],
  },
  Appointment: {
    columns: ['Description', 'Status', 'Start', 'End', 'Participant'],
    row: (r) => [
      r.description || getDisplayText(r.serviceType?.[0]) || '—',
      getStatusBadge(r.status),
      formatDate(r.start),
      formatDate(r.end),
      r.participant?.[0]?.actor?.display || '—',
    ],
  },
  Claim: {
    columns: ['Patient', 'Type', 'Status', 'Total', 'Created'],
    row: (r) => [
      r.patient?.display || '—',
      getDisplayText(r.type),
      getStatusBadge(r.status),
      r.total?.value ? `$${r.total.value.toFixed(2)}` : '—',
      formatDate(r.created),
    ],
  },
  DiagnosticReport: {
    columns: ['Patient', 'Report', 'Status', 'Category', 'Date'],
    row: (r) => [
      r.subject?.display || '—',
      getDisplayText(r.code),
      getStatusBadge(r.status),
      getDisplayText(r.category?.[0]),
      formatDate(r.effectiveDateTime),
    ],
  },
  Organization: {
    columns: ['Name', 'Type', 'Active', 'Telecom', 'Address'],
    row: (r) => [
      r.name || '—',
      getDisplayText(r.type?.[0]),
      getStatusBadge(r.active !== false ? 'active' : 'cancelled'),
      r.telecom?.[0]?.value || '—',
      r.address?.[0]?.city ? `${r.address[0].city}, ${r.address[0].state || ''}` : '—',
    ],
  },
  Practitioner: {
    columns: ['Name', 'Gender', 'Qualification', 'Telecom', 'Active'],
    row: (r) => [
      getPractitionerName(r),
      r.gender || '—',
      r.qualification?.[0]?.code?.text || getDisplayText(r.qualification?.[0]?.code) || '—',
      r.telecom?.[0]?.value || '—',
      getStatusBadge(r.active !== false ? 'active' : 'cancelled'),
    ],
  },
  Location: {
    columns: ['Name', 'Type', 'Status', 'Mode', 'Address'],
    row: (r) => [
      r.name || '—',
      getDisplayText(r.type?.[0]),
      getStatusBadge(r.status),
      r.mode || '—',
      r.address?.city ? `${r.address.city}, ${r.address.state || ''}` : '—',
    ],
  },
};

/* ── FORM CONFIGS ── */
const FORM_CONFIGS = {
  Patient: {
    fields: [
      { key: 'family', label: 'Last Name', required: true },
      { key: 'given', label: 'First Name', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other', 'unknown'] },
      { key: 'birthDate', label: 'Birth Date', type: 'date' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
    ],
    toResource: (d) => ({
      resourceType: 'Patient', active: true,
      name: [{ use: 'official', family: d.family, given: [d.given] }],
      gender: d.gender || 'unknown',
      birthDate: d.birthDate || undefined,
      telecom: [
        d.phone && { system: 'phone', value: d.phone, use: 'mobile' },
        d.email && { system: 'email', value: d.email },
      ].filter(Boolean),
    }),
    fromResource: (r) => ({
      family: r.name?.[0]?.family || '',
      given: r.name?.[0]?.given?.[0] || '',
      gender: r.gender || 'unknown',
      birthDate: r.birthDate || '',
      phone: r.telecom?.find(t => t.system === 'phone')?.value || '',
      email: r.telecom?.find(t => t.system === 'email')?.value || '',
    }),
  },
  Organization: {
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'type', label: 'Type' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
    ],
    toResource: (d) => ({
      resourceType: 'Organization', active: true,
      name: d.name,
      type: d.type ? [{ text: d.type }] : undefined,
      telecom: d.phone ? [{ system: 'phone', value: d.phone }] : undefined,
      address: d.city ? [{ city: d.city, state: d.state }] : undefined,
    }),
    fromResource: (r) => ({
      name: r.name || '',
      type: r.type?.[0]?.text || '',
      phone: r.telecom?.[0]?.value || '',
      city: r.address?.[0]?.city || '',
      state: r.address?.[0]?.state || '',
    }),
  },
  Practitioner: {
    fields: [
      { key: 'family', label: 'Last Name', required: true },
      { key: 'given', label: 'First Name', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other', 'unknown'] },
      { key: 'qualification', label: 'Qualification' },
      { key: 'phone', label: 'Phone' },
    ],
    toResource: (d) => ({
      resourceType: 'Practitioner', active: true,
      name: [{ use: 'official', family: d.family, given: [d.given] }],
      gender: d.gender || 'unknown',
      qualification: d.qualification ? [{ code: { text: d.qualification } }] : undefined,
      telecom: d.phone ? [{ system: 'phone', value: d.phone }] : undefined,
    }),
    fromResource: (r) => ({
      family: r.name?.[0]?.family || '',
      given: r.name?.[0]?.given?.[0] || '',
      gender: r.gender || 'unknown',
      qualification: r.qualification?.[0]?.code?.text || '',
      phone: r.telecom?.[0]?.value || '',
    }),
  },
};

/* ── Hooks ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

/* ────────────────── APP ────────────────── */
export default function App() {
  const [page, setPage] = useState('overview');
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit'|'view'|'delete', resource?, data? }
  const [formData, setFormData] = useState({});
  const { toasts, add: toast } = useToast();
  const prevPageRef = useRef(page);

  // Load stats
  useEffect(() => {
    fhir.health().then(setStats).catch(() => {});
  }, []);

  // Load resources when page changes
  useEffect(() => {
    if (page === 'overview') { setLoading(false); return; }
    setLoading(true);
    setSearchTerm('');
    fhir.search(page, { _count: 200 })
      .then(bundle => setResources(bundle?.entry?.map(e => e.resource) || []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [page]);

  const refreshPage = () => {
    if (page === 'overview') return;
    setLoading(true);
    fhir.search(page, { _count: 200 })
      .then(bundle => setResources(bundle?.entry?.map(e => e.resource) || []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
    fhir.health().then(setStats).catch(() => {});
  };

  const filteredResources = resources.filter(r =>
    !searchTerm || JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── CRUD handlers ── */
  const handleCreate = async () => {
    try {
      const cfg = FORM_CONFIGS[page];
      if (!cfg) { toast('Form not configured for ' + page, 'error'); return; }
      const resource = cfg.toResource(formData);
      await fhir.create(page, resource);
      toast(`${page} created successfully`);
      setModal(null);
      refreshPage();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleUpdate = async () => {
    try {
      const cfg = FORM_CONFIGS[page];
      if (!cfg) { toast('Form not configured for ' + page, 'error'); return; }
      const resource = { ...cfg.toResource(formData), id: modal.resource.id };
      await fhir.update(page, modal.resource.id, resource);
      toast(`${page} updated successfully`);
      setModal(null);
      refreshPage();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    try {
      await fhir.delete(page, modal.resource.id);
      toast(`${page} deleted`);
      setModal(null);
      refreshPage();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openCreate = () => {
    setFormData({});
    setModal({ mode: 'create' });
  };

  const openEdit = (r) => {
    const cfg = FORM_CONFIGS[page];
    setFormData(cfg ? cfg.fromResource(r) : {});
    setModal({ mode: 'edit', resource: r });
  };

  const openView = (r) => setModal({ mode: 'view', resource: r });
  const openDelete = (r) => setModal({ mode: 'delete', resource: r });

  /* ── Chart data builders ── */
  const buildOverviewCharts = () => {
    if (!stats?.resources) return {};
    const res = stats.resources;

    // Resource distribution
    const distribution = RESOURCE_NAV
      .filter(n => res[n.key]?.count > 0)
      .map(n => ({ name: n.label, value: res[n.key].count }));

    return { distribution };
  };

  const chartData = buildOverviewCharts();

  /* ── Render ── */
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>FHIR R4 Explorer</h1>
          <div className="version">v4.0.1 • R4</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <button className={`nav-item${page === 'overview' ? ' active' : ''}`} onClick={() => setPage('overview')}>
            {Icons.home} Dashboard
          </button>

          <div className="nav-section-label">Clinical</div>
          {RESOURCE_NAV.slice(0, 8).map(n => (
            <button key={n.key} className={`nav-item${page === n.key ? ' active' : ''}`} onClick={() => setPage(n.key)}>
              {n.icon} {n.label}
              {stats?.resources?.[n.key]?.count > 0 && (
                <span className="count">{stats.resources[n.key].count}</span>
              )}
            </button>
          ))}

          <div className="nav-section-label">Administrative</div>
          {RESOURCE_NAV.slice(8).map(n => (
            <button key={n.key} className={`nav-item${page === n.key ? ' active' : ''}`} onClick={() => setPage(n.key)}>
              {n.icon} {n.label}
              {stats?.resources?.[n.key]?.count > 0 && (
                <span className="count">{stats.resources[n.key].count}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <a href="/swagger" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {Icons.fileText} Swagger UI ↗
          </a>
          <div>{fhir.isRemote() ? `Remote: ${fhir.getBaseUrl()}` : 'Local FHIR R4 Server'}</div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {page === 'overview' ? (
          <OverviewPage stats={stats} chartData={chartData} setPage={setPage} />
        ) : (
          <ResourcePage
            resourceType={page}
            resources={filteredResources}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onView={openView}
            onEdit={openEdit}
            onDelete={openDelete}
            onCreate={openCreate}
            total={resources.length}
          />
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {modal.mode === 'view' && (
              <>
                <div className="modal-header">
                  <h3>{page} Detail</h3>
                  <button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>{Icons.x}</button>
                </div>
                <div className="modal-body">
                  <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-mono)' }}>
                    {JSON.stringify(modal.resource, null, 2)}
                  </pre>
                </div>
              </>
            )}
            {modal.mode === 'delete' && (
              <>
                <div className="modal-header">
                  <h3>Confirm Delete</h3>
                  <button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>{Icons.x}</button>
                </div>
                <div className="modal-body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Delete this {page} resource? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>({modal.resource.id})</span>
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}>{Icons.trash} Delete</button>
                </div>
              </>
            )}
            {(modal.mode === 'create' || modal.mode === 'edit') && (
              <>
                <div className="modal-header">
                  <h3>{modal.mode === 'create' ? 'Create' : 'Edit'} {page}</h3>
                  <button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>{Icons.x}</button>
                </div>
                <div className="modal-body">
                  {FORM_CONFIGS[page] ? (
                    FORM_CONFIGS[page].fields.map(f => (
                      <div className="form-group" key={f.key}>
                        <label>{f.label}{f.required && ' *'}</label>
                        {f.type === 'select' ? (
                          <select className="form-select" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                            <option value="">Select...</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            className="form-input"
                            type={f.type || 'text'}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                            placeholder={f.label}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="form-group">
                      <label>Resource JSON</label>
                      <textarea
                        className="form-textarea"
                        rows={12}
                        value={formData._json || JSON.stringify({ resourceType: page }, null, 2)}
                        onChange={e => setFormData({ _json: e.target.value })}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={modal.mode === 'create' ? handleCreate : handleUpdate}
                  >
                    {modal.mode === 'create' ? 'Create' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────── OVERVIEW PAGE ────────────────── */
function OverviewPage({ stats, chartData, setPage }) {
  if (!stats) return <div className="loading-overlay"><div className="spinner" /> Loading dashboard...</div>;

  const topResources = RESOURCE_NAV.filter(n => stats.resources?.[n.key]?.count > 0);

  // Build demographic data from stats
  const totalResources = Object.values(stats.resources || {}).reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="subtitle">FHIR R4 Server Overview • {totalResources} total resources</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {topResources.slice(0, 8).map(n => (
          <div
            key={n.key}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setPage(n.key)}
          >
            <div className="stat-icon" style={{ color: `var(--accent-${n.color})` }}>{n.icon}</div>
            <div className="stat-label">{n.label}</div>
            <div className="stat-value" style={{ color: `var(--accent-${n.color})` }}>
              {stats.resources[n.key].count}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Resource Distribution */}
        <div className="card">
          <div className="card-header"><h2>Resource Distribution</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.distribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: '0.7rem' }}>
                  {(chartData.distribution || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={CUSTOM_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Resources Bar Chart */}
        <div className="card">
          <div className="card-header"><h2>Resource Counts</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.distribution || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
                <XAxis dataKey="name" tick={{ fill: '#8895aa', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#8895aa', fontSize: 11 }} />
                <Tooltip content={CUSTOM_TOOLTIP} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(chartData.distribution || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="card">
        <div className="card-header"><h2>All Resource Types</h2></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {RESOURCE_NAV.map(n => (
              <button
                key={n.key}
                className="nav-item"
                onClick={() => setPage(n.key)}
                style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <span style={{ color: `var(--accent-${n.color})` }}>{n.icon}</span>
                {n.label}
                <span className="count">{stats.resources?.[n.key]?.count || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ────────────────── RESOURCE PAGE ────────────────── */
function ResourcePage({ resourceType, resources, loading, searchTerm, setSearchTerm, onView, onEdit, onDelete, onCreate, total }) {
  const config = TABLE_CONFIGS[resourceType];
  const navItem = RESOURCE_NAV.find(n => n.key === resourceType);
  const hasForm = !!FORM_CONFIGS[resourceType];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{navItem?.label || resourceType}</h2>
          <div className="subtitle">{total} resource{total !== 1 ? 's' : ''} • FHIR {resourceType}</div>
        </div>
        <button className="btn btn-primary" onClick={onCreate}>
          {Icons.plus} New {resourceType}
        </button>
      </div>

      <div className="search-bar">
        {Icons.search}
        <input
          placeholder={`Search ${navItem?.label || resourceType}...`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setSearchTerm('')}>{Icons.x}</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading...</div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            {navItem?.icon}
            <p>No {navItem?.label || resourceType} found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {(config?.columns || ['ID', 'Resource Type']).map(c => (
                    <th key={c}>{c}</th>
                  ))}
                  <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => {
                  const cells = config?.row(r) || [r.id, r.resourceType];
                  return (
                    <tr key={r.id}>
                      {cells.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-icon btn-ghost btn-sm" title="View" onClick={() => onView(r)}>{Icons.eye}</button>
                          {hasForm && <button className="btn btn-icon btn-ghost btn-sm" title="Edit" onClick={() => onEdit(r)}>{Icons.edit}</button>}
                          <button className="btn btn-icon btn-ghost btn-sm" title="Delete" onClick={() => onDelete(r)} style={{ color: 'var(--accent-red)' }}>{Icons.trash}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
