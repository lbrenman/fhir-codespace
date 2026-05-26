import { useState, useEffect, useCallback } from 'react';
import { fhir } from './api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

/* ── Icon SVGs ── */
const Icons = {
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  activity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  pill: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/></svg>,
  stethoscope: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 0012 0V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  mapPin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  fileText: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  syringe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4"/><path d="M17 7l3-3"/><path d="M19 9l-8.7 8.7c-.4.4-1 .4-1.4 0L5.3 14.1c-.4-.4-.4-1 0-1.4L14 4"/><path d="M5 14l-2 2"/><path d="M7 17l-3 3"/></svg>,
  scissors: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  json: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
};

const NAV = [
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

const COLORS = ['#4f8fff','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#fb923c','#e879f9'];
const CT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:'#1a2235',border:'1px solid #2a3550',borderRadius:8,padding:'8px 12px',fontSize:'0.8rem'}}>
    <div style={{color:'#8895aa',marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||'#e8ecf4'}}>{p.name}: {p.value}</div>)}
  </div>;
};

/* ── Helpers (ultra-defensive) ── */
const getName = r => {
  try {
    if(!r) return 'Unknown';
    const n = Array.isArray(r.name) ? r.name[0] : r.name;
    if(!n || typeof n === 'string') return n || 'Unknown';
    const parts = [n.prefix?.[0], ...(Array.isArray(n.given)?n.given:[n.given].filter(Boolean)), n.family].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  } catch { return 'Unknown'; }
};
const getDisplayText = cc => {
  try {
    if(!cc) return '—';
    if(typeof cc === 'string') return cc;
    return cc.text || cc.coding?.[0]?.display || cc.coding?.[0]?.code || '—';
  } catch { return '—'; }
};
const dtArr = cc => {
  try {
    if(!cc) return '—';
    if(Array.isArray(cc)) return getDisplayText(cc[0]);
    return getDisplayText(cc);
  } catch { return '—'; }
};
const badge = s => s ? <span className={`badge badge-${({active:'green',completed:'blue','in-progress':'amber',cancelled:'red',draft:'amber',finished:'green',arrived:'blue',triaged:'amber',planned:'blue',booked:'blue',pending:'amber',fulfilled:'green',confirmed:'green',final:'green',preliminary:'amber'})[s]||'blue'}`}>{s}</span> : null;
const fmtDate = d => { try { if(!d) return '—'; return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); } catch{ return d||'—'; }};
const fmtDateTime = d => { try { if(!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}) + ' ' + dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'UTC'}); } catch{ return d||'—'; }};
const refDisplay = r => { try { return r?.display || r?.reference?.split('/')?.[1] || '—'; } catch { return '—'; } };
const safeArr = v => Array.isArray(v) ? v : (v ? [v] : []);
const getAddr = r => { try { const a = safeArr(r.address)[0]; return a?.city ? `${a.city}${a.state?', '+a.state:''}` : '—'; } catch { return '—'; } };
const getPhone = r => { try { return safeArr(r.telecom).find(t=>t?.system==='phone')?.value || safeArr(r.telecom)[0]?.value || '—'; } catch { return '—'; } };

/* ── Table Configs (each row function wrapped in try/catch) ── */
const safeRow = fn => r => { try { return fn(r); } catch { return [r?.id||'—']; } };

const TABLE_CONFIGS = {
  Patient: { cols: ['Name','Gender','Birth Date','MRN','Status'], row: safeRow(r => [getName(r), r.gender||'—', fmtDate(r.birthDate), safeArr(r.identifier)[0]?.value||'—', badge(r.active!==false?'active':'cancelled')]) },
  Encounter: { cols: ['Patient','Class','Type','Status','Period Start'], row: safeRow(r => [refDisplay(r.subject), r.class?.display||r.class?.code||'—', dtArr(r.type), badge(r.status), fmtDate(r.period?.start)]) },
  Condition: { cols: ['Patient','Condition','Clinical Status','Severity','Onset'], row: safeRow(r => [refDisplay(r.subject), getDisplayText(r.code), getDisplayText(r.clinicalStatus), getDisplayText(r.severity), fmtDate(r.onsetDateTime)]) },
  Observation: { cols: ['Patient','Observation','Value','Status','Date'], row: safeRow(r => [refDisplay(r.subject), getDisplayText(r.code), r.valueQuantity?`${r.valueQuantity.value} ${r.valueQuantity.unit||''}`:(r.component?`${r.component[0]?.valueQuantity?.value||''}/${r.component[1]?.valueQuantity?.value||''} mmHg`:r.valueString||'—'), badge(r.status), fmtDate(r.effectiveDateTime)]) },
  MedicationRequest: { cols: ['Patient','Medication','Status','Intent','Date'], row: safeRow(r => [refDisplay(r.subject), getDisplayText(r.medicationCodeableConcept), badge(r.status), r.intent||'—', fmtDate(r.authoredOn)]) },
  AllergyIntolerance: { cols: ['Patient','Substance','Category','Criticality','Status'], row: safeRow(r => [refDisplay(r.patient), getDisplayText(r.code), safeArr(r.category).join(', ')||'—', r.criticality||'—', badge(r.clinicalStatus?.coding?.[0]?.code)]) },
  Immunization: { cols: ['Patient','Vaccine','Status','Date','Dose'], row: safeRow(r => [refDisplay(r.patient), getDisplayText(r.vaccineCode), badge(r.status), fmtDate(r.occurrenceDateTime), r.protocolApplied?.[0]?.doseNumberPositiveInt||'—']) },
  Procedure: { cols: ['Patient','Procedure','Status','Date','Performer'], row: safeRow(r => [refDisplay(r.subject), getDisplayText(r.code), badge(r.status), fmtDate(r.performedDateTime||r.performedPeriod?.start), r.performer?.[0]?.actor?.display||'—']) },
  Appointment: { cols: ['Service Type','Status','Start','End','Participant'], row: safeRow(r => [dtArr(r.serviceType)||r.description||'—', badge(r.status), fmtDateTime(r.start), fmtDateTime(r.end), safeArr(r.participant)[0]?.actor?.display||'—']) },
  Claim: { cols: ['Patient','Type','Status','Total','Created'], row: safeRow(r => [refDisplay(r.patient), getDisplayText(r.type), badge(r.status), r.total?.value!=null?`$${r.total.value.toFixed(2)}`:'—', fmtDate(r.created)]) },
  DiagnosticReport: { cols: ['Patient','Report','Status','Category','Date'], row: safeRow(r => [refDisplay(r.subject), getDisplayText(r.code), badge(r.status), dtArr(r.category), fmtDate(r.effectiveDateTime)]) },
  Organization: { cols: ['Name','Type','Phone','City','Status'], row: safeRow(r => [r.name||'—', dtArr(r.type), getPhone(r), getAddr(r), badge(r.active!==false?'active':'cancelled')]) },
  Practitioner: { cols: ['Name','Gender','Specialty','Phone','Status'], row: safeRow(r => [getName(r), r.gender||'—', safeArr(r.qualification)[0]?.code?.text||'—', getPhone(r), badge(r.active!==false?'active':'cancelled')]) },
  Location: { cols: ['Name','Type','Status','Mode','Organization'], row: safeRow(r => [r.name||'—', dtArr(r.type), badge(r.status), r.mode||'—', refDisplay(r.managingOrganization)]) },
};

/* ── Detail Configs (human-readable field display) ── */
const DETAIL_FIELDS = {
  Patient: r => [
    { label: 'Name', value: getName(r) },
    { label: 'Gender', value: r.gender },
    { label: 'Birth Date', value: fmtDate(r.birthDate) },
    { label: 'MRN', value: safeArr(r.identifier)[0]?.value },
    { label: 'Phone', value: getPhone(r) },
    { label: 'Address', value: getAddr(r) },
    { label: 'Organization', value: refDisplay(r.managingOrganization) },
    { label: 'Practitioner', value: refDisplay(safeArr(r.generalPractitioner)[0]) },
    { label: 'Status', value: r.active !== false ? 'Active' : 'Inactive' },
  ],
  Encounter: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Class', value: r.class?.display || r.class?.code },
    { label: 'Type', value: dtArr(r.type) },
    { label: 'Status', value: r.status },
    { label: 'Period', value: `${fmtDate(r.period?.start)} – ${fmtDate(r.period?.end)}` },
    { label: 'Provider', value: refDisplay(r.serviceProvider) },
    { label: 'Location', value: r.location?.[0]?.location?.display || refDisplay(r.location?.[0]?.location) },
  ],
  Condition: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Condition', value: getDisplayText(r.code) },
    { label: 'Code', value: r.code?.coding?.[0]?.code },
    { label: 'Clinical Status', value: getDisplayText(r.clinicalStatus) },
    { label: 'Verification', value: getDisplayText(r.verificationStatus) },
    { label: 'Onset', value: fmtDate(r.onsetDateTime) },
    { label: 'Recorded', value: fmtDate(r.recordedDate) },
  ],
  Observation: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Observation', value: getDisplayText(r.code) },
    { label: 'Code', value: r.code?.coding?.[0]?.code },
    { label: 'Value', value: r.valueQuantity ? `${r.valueQuantity.value} ${r.valueQuantity.unit||''}` : r.component ? r.component.map(c=>`${getDisplayText(c.code)}: ${c.valueQuantity?.value} ${c.valueQuantity?.unit||''}`).join(', ') : r.valueString },
    { label: 'Status', value: r.status },
    { label: 'Date', value: fmtDate(r.effectiveDateTime) },
    { label: 'Category', value: dtArr(r.category) },
  ],
  MedicationRequest: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Medication', value: getDisplayText(r.medicationCodeableConcept) },
    { label: 'Code', value: r.medicationCodeableConcept?.coding?.[0]?.code },
    { label: 'Status', value: r.status },
    { label: 'Intent', value: r.intent },
    { label: 'Authored', value: fmtDate(r.authoredOn) },
    { label: 'Requester', value: refDisplay(r.requester) },
    { label: 'Dosage', value: r.dosageInstruction?.[0]?.text },
  ],
  AllergyIntolerance: r => [
    { label: 'Patient', value: refDisplay(r.patient) },
    { label: 'Substance', value: getDisplayText(r.code) },
    { label: 'Category', value: safeArr(r.category).join(', ') },
    { label: 'Criticality', value: r.criticality },
    { label: 'Status', value: getDisplayText(r.clinicalStatus) },
    { label: 'Reaction', value: r.reaction?.[0]?.manifestation?.[0]?.text || getDisplayText(r.reaction?.[0]?.manifestation?.[0]) },
    { label: 'Severity', value: r.reaction?.[0]?.severity },
  ],
  Immunization: r => [
    { label: 'Patient', value: refDisplay(r.patient) },
    { label: 'Vaccine', value: getDisplayText(r.vaccineCode) },
    { label: 'Code', value: r.vaccineCode?.coding?.[0]?.code },
    { label: 'Status', value: r.status },
    { label: 'Date', value: fmtDate(r.occurrenceDateTime) },
    { label: 'Performer', value: r.performer?.[0]?.actor?.display },
  ],
  Procedure: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Procedure', value: getDisplayText(r.code) },
    { label: 'Code', value: r.code?.coding?.[0]?.code },
    { label: 'Status', value: r.status },
    { label: 'Date', value: fmtDate(r.performedDateTime || r.performedPeriod?.start) },
    { label: 'Performer', value: r.performer?.[0]?.actor?.display },
    { label: 'Encounter', value: refDisplay(r.encounter) },
  ],
  Appointment: r => [
    { label: 'Service Type', value: dtArr(r.serviceType) || r.description },
    { label: 'Status', value: r.status },
    { label: 'Start', value: fmtDateTime(r.start) },
    { label: 'End', value: fmtDateTime(r.end) },
    { label: 'Duration', value: r.minutesDuration ? `${r.minutesDuration} min` : null },
    { label: 'Participants', value: safeArr(r.participant).map(p=>p.actor?.display).filter(Boolean).join(', ') },
  ],
  Claim: r => [
    { label: 'Patient', value: refDisplay(r.patient) },
    { label: 'Type', value: getDisplayText(r.type) },
    { label: 'Status', value: r.status },
    { label: 'Use', value: r.use },
    { label: 'Total', value: r.total?.value != null ? `$${r.total.value.toFixed(2)} ${r.total.currency||''}` : null },
    { label: 'Created', value: fmtDate(r.created) },
    { label: 'Provider', value: refDisplay(r.provider) },
  ],
  DiagnosticReport: r => [
    { label: 'Patient', value: refDisplay(r.subject) },
    { label: 'Report', value: getDisplayText(r.code) },
    { label: 'Status', value: r.status },
    { label: 'Category', value: dtArr(r.category) },
    { label: 'Date', value: fmtDate(r.effectiveDateTime) },
    { label: 'Conclusion', value: r.conclusion },
  ],
  Organization: r => [
    { label: 'Name', value: r.name },
    { label: 'Type', value: dtArr(r.type) },
    { label: 'Phone', value: getPhone(r) },
    { label: 'Address', value: getAddr(r) },
    { label: 'Status', value: r.active !== false ? 'Active' : 'Inactive' },
  ],
  Practitioner: r => [
    { label: 'Name', value: getName(r) },
    { label: 'Gender', value: r.gender },
    { label: 'Specialty', value: safeArr(r.qualification)[0]?.code?.text },
    { label: 'Phone', value: getPhone(r) },
    { label: 'Status', value: r.active !== false ? 'Active' : 'Inactive' },
  ],
  Location: r => [
    { label: 'Name', value: r.name },
    { label: 'Type', value: dtArr(r.type) },
    { label: 'Status', value: r.status },
    { label: 'Mode', value: r.mode },
    { label: 'Organization', value: refDisplay(r.managingOrganization) },
  ],
};

/* ── Reference data cache for picklists ── */
function useRefData() {
  const [patients, setPatients] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fhir.search('Patient', { _count: 200 }).then(b => b?.entry?.map(e=>e.resource)||[]).catch(()=>[]),
      fhir.search('Practitioner', { _count: 200 }).then(b => b?.entry?.map(e=>e.resource)||[]).catch(()=>[]),
      fhir.search('Organization', { _count: 200 }).then(b => b?.entry?.map(e=>e.resource)||[]).catch(()=>[]),
      fhir.search('Location', { _count: 200 }).then(b => b?.entry?.map(e=>e.resource)||[]).catch(()=>[]),
    ]).then(([p, pr, o, l]) => {
      setPatients(p); setPractitioners(pr); setOrganizations(o); setLocations(l); setLoaded(true);
    });
  }, []);

  const patientOptions = patients.map(p => ({ value: p.id, label: getName(p), ref: `Patient/${p.id}`, display: getName(p) }));
  const pracOptions = practitioners.map(p => ({ value: p.id, label: getName(p), ref: `Practitioner/${p.id}`, display: getName(p) }));
  const orgOptions = organizations.map(o => ({ value: o.id, label: o.name, ref: `Organization/${o.id}`, display: o.name }));
  const locOptions = locations.map(l => ({ value: l.id, label: l.name, ref: `Location/${l.id}`, display: l.name }));

  return { patients, practitioners, organizations, locations, patientOptions, pracOptions, orgOptions, locOptions, loaded };
}

/* ── Form configs with picklist support (all 14 types) ── */
function getFormConfig(type, refs) {
  const { patientOptions, pracOptions, orgOptions, locOptions } = refs;
  const configs = {
    Patient: {
      fields: [
        { key:'family', label:'Last Name', required:true },
        { key:'given', label:'First Name', required:true },
        { key:'gender', label:'Gender', type:'select', options:[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'},{value:'unknown',label:'Unknown'}] },
        { key:'birthDate', label:'Birth Date', type:'date' },
        { key:'phone', label:'Phone' },
        { key:'organization', label:'Organization', type:'select', options:orgOptions },
        { key:'practitioner', label:'General Practitioner', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'Patient', active:true, name:[{use:'official',family:d.family,given:[d.given]}], gender:d.gender||'unknown', birthDate:d.birthDate||undefined, telecom:d.phone?[{system:'phone',value:d.phone,use:'mobile'}]:undefined, managingOrganization:d.organization?{reference:`Organization/${d.organization}`,display:orgOptions.find(o=>o.value===d.organization)?.label}:undefined, generalPractitioner:d.practitioner?[{reference:`Practitioner/${d.practitioner}`,display:pracOptions.find(p=>p.value===d.practitioner)?.label}]:undefined }),
      fromResource: r => ({ family:r.name?.[0]?.family||'', given:r.name?.[0]?.given?.[0]||'', gender:r.gender||'unknown', birthDate:r.birthDate||'', phone:safeArr(r.telecom).find(t=>t?.system==='phone')?.value||'', organization:r.managingOrganization?.reference?.split('/')?.[1]||'', practitioner:safeArr(r.generalPractitioner)[0]?.reference?.split('/')?.[1]||'' }),
    },
    Encounter: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'class', label:'Class', type:'select', options:[{value:'AMB',label:'Ambulatory'},{value:'IMP',label:'Inpatient'},{value:'EMER',label:'Emergency'}] },
        { key:'status', label:'Status', type:'select', options:[{value:'planned',label:'Planned'},{value:'in-progress',label:'In Progress'},{value:'finished',label:'Finished'},{value:'cancelled',label:'Cancelled'}] },
        { key:'startDate', label:'Start Date', type:'date' },
        { key:'practitioner', label:'Practitioner', type:'select', options:pracOptions },
        { key:'organization', label:'Service Provider', type:'select', options:orgOptions },
      ],
      toResource: d => ({ resourceType:'Encounter', status:d.status||'planned', class:{system:'http://terminology.hl7.org/CodeSystem/v3-ActCode',code:d.class||'AMB',display:({AMB:'ambulatory',IMP:'inpatient encounter',EMER:'emergency'})[d.class]||'ambulatory'}, type:[{text:({AMB:'ambulatory',IMP:'inpatient',EMER:'emergency'})[d.class||'AMB']+' visit'}], subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, period:{start:d.startDate||new Date().toISOString().split('T')[0]}, participant:d.practitioner?[{individual:{reference:`Practitioner/${d.practitioner}`}}]:undefined, serviceProvider:d.organization?{reference:`Organization/${d.organization}`,display:orgOptions.find(o=>o.value===d.organization)?.label}:undefined }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', class:r.class?.code||'AMB', status:r.status||'planned', startDate:r.period?.start||'', practitioner:r.participant?.[0]?.individual?.reference?.split('/')?.[1]||'', organization:r.serviceProvider?.reference?.split('/')?.[1]||'' }),
    },
    Condition: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Condition Name', required:true },
        { key:'code', label:'ICD-10 Code' },
        { key:'status', label:'Clinical Status', type:'select', options:[{value:'active',label:'Active'},{value:'resolved',label:'Resolved'},{value:'inactive',label:'Inactive'}] },
        { key:'onset', label:'Onset Date', type:'date' },
      ],
      toResource: d => ({ resourceType:'Condition', clinicalStatus:{coding:[{system:'http://terminology.hl7.org/CodeSystem/condition-clinical',code:d.status||'active'}]}, code:{coding:[{system:'http://hl7.org/fhir/sid/icd-10',code:d.code||'',display:d.display}],text:d.display}, subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, onsetDateTime:d.onset||undefined }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', display:getDisplayText(r.code), code:r.code?.coding?.[0]?.code||'', status:r.clinicalStatus?.coding?.[0]?.code||'active', onset:r.onsetDateTime||'' }),
    },
    Observation: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Observation Name', required:true },
        { key:'code', label:'LOINC Code' },
        { key:'value', label:'Value', required:true },
        { key:'unit', label:'Unit' },
        { key:'date', label:'Date', type:'date' },
      ],
      toResource: d => ({ resourceType:'Observation', status:'final', category:[{coding:[{system:'http://terminology.hl7.org/CodeSystem/observation-category',code:'vital-signs'}]}], code:{coding:[{system:'http://loinc.org',code:d.code||'',display:d.display}],text:d.display}, subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, valueQuantity:{value:parseFloat(d.value)||0,unit:d.unit||'',system:'http://unitsofmeasure.org'}, effectiveDateTime:d.date||new Date().toISOString().split('T')[0] }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', display:getDisplayText(r.code), code:r.code?.coding?.[0]?.code||'', value:r.valueQuantity?.value?.toString()||'', unit:r.valueQuantity?.unit||'', date:r.effectiveDateTime?.split('T')?.[0]||'' }),
    },
    MedicationRequest: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Medication Name', required:true },
        { key:'code', label:'RxNorm Code' },
        { key:'status', label:'Status', type:'select', options:[{value:'active',label:'Active'},{value:'completed',label:'Completed'},{value:'cancelled',label:'Cancelled'}] },
        { key:'intent', label:'Intent', type:'select', options:[{value:'order',label:'Order'},{value:'plan',label:'Plan'},{value:'proposal',label:'Proposal'}] },
        { key:'requester', label:'Prescriber', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'MedicationRequest', status:d.status||'active', intent:d.intent||'order', medicationCodeableConcept:{coding:[{system:'http://www.nlm.nih.gov/research/umls/rxnorm',code:d.code||'',display:d.display}],text:d.display}, subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, requester:d.requester?{reference:`Practitioner/${d.requester}`,display:pracOptions.find(p=>p.value===d.requester)?.label}:undefined, authoredOn:new Date().toISOString().split('T')[0] }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', display:getDisplayText(r.medicationCodeableConcept), code:r.medicationCodeableConcept?.coding?.[0]?.code||'', status:r.status||'active', intent:r.intent||'order', requester:r.requester?.reference?.split('/')?.[1]||'' }),
    },
    AllergyIntolerance: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Substance', required:true },
        { key:'category', label:'Category', type:'select', options:[{value:'medication',label:'Medication'},{value:'food',label:'Food'},{value:'environment',label:'Environment'},{value:'biologic',label:'Biologic'}] },
        { key:'criticality', label:'Criticality', type:'select', options:[{value:'low',label:'Low'},{value:'high',label:'High'},{value:'unable-to-assess',label:'Unable to Assess'}] },
        { key:'reaction', label:'Reaction' },
        { key:'severity', label:'Severity', type:'select', options:[{value:'mild',label:'Mild'},{value:'moderate',label:'Moderate'},{value:'severe',label:'Severe'}] },
      ],
      toResource: d => ({ resourceType:'AllergyIntolerance', clinicalStatus:{coding:[{system:'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',code:'active'}]}, verificationStatus:{coding:[{system:'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',code:'confirmed'}]}, type:'allergy', category:[d.category||'medication'], criticality:d.criticality||'low', code:{text:d.display}, patient:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, reaction:d.reaction?[{manifestation:[{text:d.reaction}],severity:d.severity||'moderate'}]:undefined }),
      fromResource: r => ({ patient:(r.patient||r.subject)?.reference?.split('/')?.[1]||'', display:getDisplayText(r.code), category:safeArr(r.category)[0]||'medication', criticality:r.criticality||'low', reaction:r.reaction?.[0]?.manifestation?.[0]?.text||'', severity:r.reaction?.[0]?.severity||'moderate' }),
    },
    Immunization: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Vaccine Name', required:true },
        { key:'code', label:'CVX Code' },
        { key:'date', label:'Date', type:'date', required:true },
        { key:'practitioner', label:'Performer', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'Immunization', status:'completed', vaccineCode:{coding:[{system:'http://hl7.org/fhir/sid/cvx',code:d.code||'',display:d.display}],text:d.display}, patient:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, occurrenceDateTime:d.date||new Date().toISOString().split('T')[0], performer:d.practitioner?[{actor:{reference:`Practitioner/${d.practitioner}`}}]:undefined }),
      fromResource: r => ({ patient:r.patient?.reference?.split('/')?.[1]||'', display:getDisplayText(r.vaccineCode), code:r.vaccineCode?.coding?.[0]?.code||'', date:r.occurrenceDateTime?.split('T')?.[0]||'', practitioner:r.performer?.[0]?.actor?.reference?.split('/')?.[1]||'' }),
    },
    Procedure: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Procedure Name', required:true },
        { key:'code', label:'CPT Code' },
        { key:'status', label:'Status', type:'select', options:[{value:'completed',label:'Completed'},{value:'in-progress',label:'In Progress'},{value:'preparation',label:'Preparation'}] },
        { key:'date', label:'Date', type:'date' },
        { key:'practitioner', label:'Performer', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'Procedure', status:d.status||'completed', code:{coding:[{system:'http://www.ama-assn.org/go/cpt',code:d.code||'',display:d.display}],text:d.display}, subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, performedDateTime:d.date||new Date().toISOString().split('T')[0], performer:d.practitioner?[{actor:{reference:`Practitioner/${d.practitioner}`}}]:undefined }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', display:getDisplayText(r.code), code:r.code?.coding?.[0]?.code||'', status:r.status||'completed', date:(r.performedDateTime||r.performedPeriod?.start||'').split('T')[0], practitioner:r.performer?.[0]?.actor?.reference?.split('/')?.[1]||'' }),
    },
    Appointment: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'practitioner', label:'Practitioner', type:'select', options:pracOptions },
        { key:'serviceType', label:'Service Type', type:'select', options:[{value:'Annual physical',label:'Annual physical'},{value:'Follow-up',label:'Follow-up'},{value:'Specialist consultation',label:'Specialist consultation'},{value:'Lab work',label:'Lab work'},{value:'General checkup',label:'General checkup'}] },
        { key:'status', label:'Status', type:'select', options:[{value:'booked',label:'Booked'},{value:'arrived',label:'Arrived'},{value:'fulfilled',label:'Fulfilled'},{value:'cancelled',label:'Cancelled'}] },
        { key:'date', label:'Date', type:'date', required:true },
        { key:'time', label:'Start Time', type:'time', required:true },
        { key:'duration', label:'Duration (minutes)', type:'select', options:[{value:'15',label:'15 min'},{value:'30',label:'30 min'},{value:'45',label:'45 min'},{value:'60',label:'60 min'},{value:'90',label:'90 min'}] },
      ],
      toResource: d => { const t=d.time||'09:00'; const dur=parseInt(d.duration)||30; const startDt=new Date(`${d.date}T${t}:00Z`); const endDt=new Date(startDt.getTime()+dur*60000); return { resourceType:'Appointment', status:d.status||'booked', serviceType:d.serviceType?[{coding:[{display:d.serviceType}]}]:undefined, start:startDt.toISOString(), end:endDt.toISOString(), minutesDuration:dur, participant:[d.patient?{actor:{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label},status:'accepted'}:null, d.practitioner?{actor:{reference:`Practitioner/${d.practitioner}`,display:pracOptions.find(p=>p.value===d.practitioner)?.label},status:'accepted'}:null].filter(Boolean) }; },
      fromResource: r => { const st=r.start?new Date(r.start):null; return { patient:safeArr(r.participant).find(p=>p.actor?.reference?.startsWith('Patient'))?.actor?.reference?.split('/')?.[1]||'', practitioner:safeArr(r.participant).find(p=>p.actor?.reference?.startsWith('Practitioner'))?.actor?.reference?.split('/')?.[1]||'', serviceType:r.serviceType?.[0]?.coding?.[0]?.display||r.description||'', status:r.status||'booked', date:r.start?.split('T')?.[0]||'', time:st?st.toISOString().slice(11,16):'09:00', duration:String(r.minutesDuration||30) }; },
    },
    Claim: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'type', label:'Type', type:'select', options:[{value:'professional',label:'Professional'},{value:'institutional',label:'Institutional'},{value:'oral',label:'Oral'},{value:'pharmacy',label:'Pharmacy'}] },
        { key:'status', label:'Status', type:'select', options:[{value:'active',label:'Active'},{value:'draft',label:'Draft'},{value:'cancelled',label:'Cancelled'}] },
        { key:'total', label:'Total ($)' },
        { key:'provider', label:'Provider', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'Claim', status:d.status||'active', type:{coding:[{system:'http://terminology.hl7.org/CodeSystem/claim-type',code:d.type||'professional',display:d.type||'Professional'}]}, use:'claim', patient:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, created:new Date().toISOString().split('T')[0], provider:d.provider?{reference:`Practitioner/${d.provider}`}:undefined, priority:{coding:[{code:'normal'}]}, total:d.total?{value:parseFloat(d.total),currency:'USD'}:undefined }),
      fromResource: r => ({ patient:r.patient?.reference?.split('/')?.[1]||'', type:r.type?.coding?.[0]?.code||'professional', status:r.status||'active', total:r.total?.value?.toString()||'', provider:r.provider?.reference?.split('/')?.[1]||'' }),
    },
    DiagnosticReport: {
      fields: [
        { key:'patient', label:'Patient', type:'select', options:patientOptions, required:true },
        { key:'display', label:'Report Name', required:true },
        { key:'code', label:'LOINC Code' },
        { key:'status', label:'Status', type:'select', options:[{value:'final',label:'Final'},{value:'preliminary',label:'Preliminary'},{value:'cancelled',label:'Cancelled'}] },
        { key:'conclusion', label:'Conclusion' },
        { key:'practitioner', label:'Performer', type:'select', options:pracOptions },
      ],
      toResource: d => ({ resourceType:'DiagnosticReport', status:d.status||'final', category:[{coding:[{system:'http://terminology.hl7.org/CodeSystem/v2-0074',code:'LAB',display:'Laboratory'}]}], code:{coding:[{system:'http://loinc.org',code:d.code||'',display:d.display}],text:d.display}, subject:d.patient?{reference:`Patient/${d.patient}`,display:patientOptions.find(p=>p.value===d.patient)?.label}:undefined, effectiveDateTime:new Date().toISOString().split('T')[0], issued:new Date().toISOString(), performer:d.practitioner?[{reference:`Practitioner/${d.practitioner}`}]:undefined, conclusion:d.conclusion||undefined }),
      fromResource: r => ({ patient:r.subject?.reference?.split('/')?.[1]||'', display:getDisplayText(r.code), code:r.code?.coding?.[0]?.code||'', status:r.status||'final', conclusion:r.conclusion||'', practitioner:safeArr(r.performer)[0]?.reference?.split('/')?.[1]||'' }),
    },
    Organization: {
      fields: [
        { key:'name', label:'Name', required:true },
        { key:'type', label:'Type', type:'select', options:[{value:'prov',label:'Healthcare Provider'},{value:'ins',label:'Insurance Company'},{value:'dept',label:'Department'},{value:'other',label:'Other'}] },
        { key:'phone', label:'Phone' },
        { key:'city', label:'City' },
        { key:'state', label:'State' },
      ],
      toResource: d => ({ resourceType:'Organization', active:true, name:d.name, type:d.type?[{coding:[{code:d.type,display:({prov:'Healthcare Provider',ins:'Insurance Company',dept:'Department',other:'Other'})[d.type]}]}]:undefined, telecom:d.phone?[{system:'phone',value:d.phone}]:undefined, address:d.city?[{city:d.city,state:d.state,country:'US'}]:undefined }),
      fromResource: r => ({ name:r.name||'', type:safeArr(r.type)[0]?.coding?.[0]?.code||'', phone:getPhone(r), city:safeArr(r.address)[0]?.city||'', state:safeArr(r.address)[0]?.state||'' }),
    },
    Practitioner: {
      fields: [
        { key:'family', label:'Last Name', required:true },
        { key:'given', label:'First Name', required:true },
        { key:'gender', label:'Gender', type:'select', options:[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}] },
        { key:'specialty', label:'Specialty' },
        { key:'phone', label:'Phone' },
      ],
      toResource: d => ({ resourceType:'Practitioner', active:true, name:[{use:'official',family:d.family,given:[d.given]}], gender:d.gender||'unknown', qualification:d.specialty?[{code:{text:d.specialty}}]:undefined, telecom:d.phone?[{system:'phone',value:d.phone}]:undefined }),
      fromResource: r => ({ family:r.name?.[0]?.family||'', given:r.name?.[0]?.given?.[0]||'', gender:r.gender||'', specialty:safeArr(r.qualification)[0]?.code?.text||'', phone:getPhone(r) }),
    },
    Location: {
      fields: [
        { key:'name', label:'Name', required:true },
        { key:'status', label:'Status', type:'select', options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'},{value:'suspended',label:'Suspended'}] },
        { key:'mode', label:'Mode', type:'select', options:[{value:'instance',label:'Instance'},{value:'kind',label:'Kind'}] },
        { key:'type', label:'Type', type:'select', options:[{value:'ER',label:'Emergency'},{value:'ICU',label:'ICU'},{value:'HU',label:'General Ward'},{value:'OF',label:'Outpatient/Clinic'}] },
        { key:'organization', label:'Managing Organization', type:'select', options:orgOptions },
      ],
      toResource: d => ({ resourceType:'Location', name:d.name, status:d.status||'active', mode:d.mode||'instance', type:d.type?[{coding:[{system:'http://terminology.hl7.org/CodeSystem/v3-RoleCode',code:d.type}]}]:undefined, managingOrganization:d.organization?{reference:`Organization/${d.organization}`,display:orgOptions.find(o=>o.value===d.organization)?.label}:undefined }),
      fromResource: r => ({ name:r.name||'', status:r.status||'active', mode:r.mode||'instance', type:safeArr(r.type)[0]?.coding?.[0]?.code||'', organization:r.managingOrganization?.reference?.split('/')?.[1]||'' }),
    },
  };
  return configs[type] || null;
}

/* ── Toast hook ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

/* ════════════════════ APP ════════════════════ */
export default function App() {
  const [page, setPage] = useState('overview');
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [detail, setDetail] = useState(null);
  const { toasts, add: toast } = useToast();
  const refs = useRefData();

  useEffect(() => { fhir.health().then(setStats).catch(()=>{}); }, []);

  useEffect(() => {
    if (page === 'overview') { setLoading(false); return; }
    setLoading(true); setSearchTerm(''); setDetail(null);
    fhir.search(page, { _count: 500 })
      .then(b => setResources(b?.entry?.map(e => e.resource) || []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [page]);

  const refresh = () => {
    if (page === 'overview') return;
    setLoading(true);
    fhir.search(page, { _count: 500 })
      .then(b => setResources(b?.entry?.map(e => e.resource) || []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
    fhir.health().then(setStats).catch(()=>{});
  };

  const filtered = resources.filter(r => !searchTerm || JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = async () => {
    try {
      const cfg = getFormConfig(page, refs);
      if (cfg) {
        if (modal.mode === 'create') {
          await fhir.create(page, cfg.toResource(formData));
          toast(`${page} created`);
        } else {
          await fhir.update(page, modal.resource.id, { ...cfg.toResource(formData), id: modal.resource.id });
          toast(`${page} updated`);
        }
      } else {
        // JSON fallback
        const parsed = JSON.parse(formData._json || '{}');
        if (modal.mode === 'create') {
          await fhir.create(page, parsed);
          toast(`${page} created`);
        } else {
          await fhir.update(page, modal.resource.id, { ...parsed, id: modal.resource.id });
          toast(`${page} updated`);
        }
      }
      setModal(null); refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    try {
      await fhir.delete(page, modal.resource.id);
      toast(`${page} deleted`); setModal(null); setDetail(null); refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openCreate = () => { setFormData({}); setModal({ mode: 'create' }); };
  const openEdit = r => { const cfg = getFormConfig(page, refs); setFormData(cfg ? cfg.fromResource(r) : { _json: JSON.stringify(r, null, 2) }); setModal({ mode: 'edit', resource: r }); };
  const openDelete = r => setModal({ mode: 'delete', resource: r });

  const chartData = (() => {
    if (!stats?.resources) return {};
    return { distribution: NAV.filter(n => stats.resources[n.key]?.count > 0).map(n => ({ name: n.label, value: stats.resources[n.key].count })) };
  })();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header"><h1>FHIR R4 Explorer</h1><div className="version">v4.0.1 • R4</div></div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <button className={`nav-item${page==='overview'?' active':''}`} onClick={()=>{setPage('overview');setDetail(null);}}>{Icons.home} Dashboard</button>
          <div className="nav-section-label">Clinical</div>
          {NAV.slice(0,8).map(n => <button key={n.key} className={`nav-item${page===n.key?' active':''}`} onClick={()=>{setPage(n.key);setDetail(null);}}>{n.icon} {n.label}{stats?.resources?.[n.key]?.count>0&&<span className="count">{stats.resources[n.key].count}</span>}</button>)}
          <div className="nav-section-label">Administrative</div>
          {NAV.slice(8).map(n => <button key={n.key} className={`nav-item${page===n.key?' active':''}`} onClick={()=>{setPage(n.key);setDetail(null);}}>{n.icon} {n.label}{stats?.resources?.[n.key]?.count>0&&<span className="count">{stats.resources[n.key].count}</span>}</button>)}
        </nav>
        <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',fontSize:'0.7rem',color:'var(--text-muted)'}}>
          <a href="/swagger" target="_blank" rel="noopener noreferrer" style={{color:'var(--accent-blue)',textDecoration:'none',display:'flex',alignItems:'center',gap:6,marginBottom:6}}>{Icons.fileText} Swagger UI ↗</a>
          <div>{fhir.isRemote() ? `Remote: ${fhir.getBaseUrl()}` : 'Local FHIR R4 Server'}</div>
        </div>
      </aside>

      <main className="main-content">
        {page === 'overview' ? <OverviewPage stats={stats} chartData={chartData} setPage={p=>{setPage(p);setDetail(null);}} />
        : detail ? <DetailPage detail={detail} page={page} onBack={()=>setDetail(null)} onEdit={r=>openEdit(r)} onDelete={r=>openDelete(r)} />
        : <ResourcePage type={page} resources={filtered} loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            onView={r=>setDetail({resource:r,type:page})} onEdit={openEdit} onDelete={openDelete} onCreate={openCreate} total={resources.length} />}
      </main>

      {modal && <div className="modal-backdrop" onClick={()=>setModal(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          {modal.mode === 'delete' ? <>
            <div className="modal-header"><h3>Confirm Delete</h3><button className="btn btn-icon btn-ghost" onClick={()=>setModal(null)}>{Icons.x}</button></div>
            <div className="modal-body"><p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>Delete this {page}? <span style={{fontFamily:'var(--font-mono)',fontSize:'0.78rem',color:'var(--text-muted)'}}>({modal.resource.id})</span></p></div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>{Icons.trash} Delete</button></div>
          </> : <>
            <div className="modal-header"><h3>{modal.mode==='create'?'Create':'Edit'} {page}</h3><button className="btn btn-icon btn-ghost" onClick={()=>setModal(null)}>{Icons.x}</button></div>
            <div className="modal-body">
              {getFormConfig(page, refs) ? getFormConfig(page, refs).fields.map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}{f.required && ' *'}</label>
                  {f.type === 'select' ? (
                    <select className="form-select" value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}>
                      <option value="">Select...</option>
                      {(f.options||[]).map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" type={f.type||'text'} value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} placeholder={f.label} />
                  )}
                </div>
              )) : (
                <div className="form-group">
                  <label>Resource JSON</label>
                  <textarea className="form-textarea" rows={12} value={formData._json||JSON.stringify({resourceType:page},null,2)} onChange={e=>setFormData({_json:e.target.value})} style={{fontFamily:'var(--font-mono)',fontSize:'0.78rem'}} />
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{modal.mode==='create'?'Create':'Save Changes'}</button></div>
          </>}
        </div>
      </div>}

      <div className="toast-container">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}</div>
    </div>
  );
}

/* ════════════════════ OVERVIEW ════════════════════ */
function OverviewPage({ stats, chartData, setPage }) {
  if (!stats) return <div className="loading-overlay"><div className="spinner" /> Loading dashboard...</div>;
  const total = Object.values(stats.resources||{}).reduce((s,r) => s + (r.count||0), 0);
  const topResources = NAV.filter(n => stats.resources?.[n.key]?.count > 0);

  return <>
    <div className="page-header"><div><h2>Dashboard</h2><div className="subtitle">FHIR R4 Server Overview • {total} total resources</div></div></div>
    <div className="stats-grid">
      {topResources.slice(0,8).map(n => (
        <div key={n.key} className="stat-card" style={{cursor:'pointer'}} onClick={()=>setPage(n.key)}>
          <div className="stat-icon" style={{color:`var(--accent-${n.color})`}}>{n.icon}</div>
          <div className="stat-label">{n.label}</div>
          <div className="stat-value" style={{color:`var(--accent-${n.color})`}}>{stats.resources[n.key].count}</div>
        </div>
      ))}
    </div>
    <div className="charts-grid">
      <div className="card"><div className="card-header"><h2>Resource Distribution</h2></div><div className="card-body">
        <ResponsiveContainer width="100%" height={250}><PieChart>
          <Pie data={chartData.distribution||[]} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:'0.7rem'}}>
            {(chartData.distribution||[]).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Pie><Tooltip content={CT} />
        </PieChart></ResponsiveContainer>
      </div></div>
      <div className="card"><div className="card-header"><h2>Resource Counts</h2></div><div className="card-body">
        <ResponsiveContainer width="100%" height={250}><BarChart data={chartData.distribution||[]} margin={{top:5,right:20,bottom:5,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
          <XAxis dataKey="name" tick={{fill:'#8895aa',fontSize:11}} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{fill:'#8895aa',fontSize:11}} />
          <Tooltip content={CT} />
          <Bar dataKey="value" radius={[4,4,0,0]}>{(chartData.distribution||[]).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar>
        </BarChart></ResponsiveContainer>
      </div></div>
    </div>
    <div className="card"><div className="card-header"><h2>All Resource Types</h2></div><div className="card-body">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
        {NAV.map(n => <button key={n.key} className="nav-item" onClick={()=>setPage(n.key)} style={{border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
          <span style={{color:`var(--accent-${n.color})`}}>{n.icon}</span> {n.label} <span className="count">{stats.resources?.[n.key]?.count||0}</span>
        </button>)}
      </div>
    </div></div>
  </>;
}

/* ════════════════════ RESOURCE LIST ════════════════════ */
function ResourcePage({ type, resources, loading, searchTerm, setSearchTerm, onView, onEdit, onDelete, onCreate, total }) {
  const cfg = TABLE_CONFIGS[type];
  const nav = NAV.find(n => n.key === type);

  return <>
    <div className="page-header">
      <div><h2>{nav?.label||type}</h2><div className="subtitle">{total} resource{total!==1?'s':''} • FHIR {type}</div></div>
      <button className="btn btn-primary" onClick={onCreate}>{Icons.plus} New {type}</button>
    </div>
    <div className="search-bar">{Icons.search}<input placeholder={`Search ${nav?.label||type}...`} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />{searchTerm&&<button className="btn btn-icon btn-ghost btn-sm" onClick={()=>setSearchTerm('')}>{Icons.x}</button>}</div>
    <div className="card">
      {loading ? <div className="loading-overlay"><div className="spinner" /> Loading...</div>
      : resources.length === 0 ? <div className="empty-state">{nav?.icon}<p>No {nav?.label||type} found</p></div>
      : <div className="table-wrapper"><table><thead><tr>{(cfg?.cols||['ID','Type']).map(c=><th key={c}>{c}</th>)}<th style={{width:120,textAlign:'right'}}>Actions</th></tr></thead>
        <tbody>{resources.map(r => {
          let cells;
          try { cells = cfg?.row(r) || [r.id, r.resourceType]; } catch { cells = [r.id || '—', r.resourceType || '—']; }
          return <tr key={r.id} style={{cursor:'pointer'}} onClick={()=>onView(r)}>
            {cells.map((c,i) => <td key={i}>{c}</td>)}
            <td style={{textAlign:'right'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                <button className="btn btn-icon btn-ghost btn-sm" title="View" onClick={()=>onView(r)}>{Icons.eye}</button>
                <button className="btn btn-icon btn-ghost btn-sm" title="Edit" onClick={()=>onEdit(r)}>{Icons.edit}</button>
                <button className="btn btn-icon btn-ghost btn-sm" title="Delete" onClick={()=>onDelete(r)} style={{color:'var(--accent-red)'}}>{Icons.trash}</button>
              </div>
            </td>
          </tr>;
        })}</tbody></table></div>}
    </div>
  </>;
}

/* ════════════════════ DETAIL PAGE ════════════════════ */
function DetailPage({ detail, page, onBack, onEdit, onDelete }) {
  const { resource: r, type } = detail;
  const [showJson, setShowJson] = useState(false);
  const [patientObs, setPatientObs] = useState([]);

  useEffect(() => {
    if (type !== 'Patient') return;
    fhir.search('Observation', { _count: 1000 })
      .then(b => {
        const all = b?.entry?.map(e=>e.resource) || [];
        setPatientObs(all.filter(o => o.subject?.reference === `Patient/${r.id}`));
      })
      .catch(() => setPatientObs([]));
  }, [type, r.id]);

  const fieldsFn = DETAIL_FIELDS[type];
  let fields = [];
  try { fields = fieldsFn ? fieldsFn(r) : []; } catch { fields = []; }
  const nav = NAV.find(n => n.key === type);

  return <>
    <div className="page-header">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>{Icons.back} Back</button>
        <div><h2>{nav?.label?.replace(/s$/,'')||type} Detail</h2><div className="subtitle">ID: {r.id}</div></div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowJson(!showJson)}>{Icons.json} {showJson?'Fields':'JSON'}</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>onEdit(r)}>{Icons.edit} Edit</button>
        <button className="btn btn-danger btn-sm" onClick={()=>onDelete(r)}>{Icons.trash} Delete</button>
      </div>
    </div>

    {showJson ? (
      <div className="card"><div className="card-body">
        <pre style={{fontSize:'0.78rem',color:'var(--text-secondary)',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',fontFamily:'var(--font-mono)'}}>{JSON.stringify(r, null, 2)}</pre>
      </div></div>
    ) : (
      <div className="card"><div className="card-header"><h2>Details</h2></div><div className="card-body">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {fields.filter(f=>f.value!=null&&f.value!=='—'&&f.value!=='').map((f,i) => (
            <div key={i}>
              <div style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{f.label}</div>
              <div style={{fontSize:'0.9rem',color:'var(--text-primary)'}}>{f.value}</div>
            </div>
          ))}
        </div>
      </div></div>
    )}

    {type === 'Patient' && patientObs.length > 0 && <PatientVitalsCharts observations={patientObs} />}
    {type === 'Patient' && <PatientRelated patientId={r.id} />}
  </>;
}

/* ════════════════════ PATIENT VITALS CHARTS ════════════════════ */
function PatientVitalsCharts({ observations }) {
  const groups = {};
  observations.forEach(o => {
    const name = getDisplayText(o.code);
    if (!groups[name]) groups[name] = [];
    if (o.component) {
      const sys = o.component.find(c => c.code?.coding?.[0]?.code === '8480-6');
      const dia = o.component.find(c => c.code?.coding?.[0]?.code === '8462-4');
      groups[name].push({ date: o.effectiveDateTime, sortDate: new Date(o.effectiveDateTime).getTime(), Systolic: sys?.valueQuantity?.value, Diastolic: dia?.valueQuantity?.value, unit: 'mmHg' });
      return;
    }
    if (o.valueQuantity) {
      groups[name].push({ date: o.effectiveDateTime, sortDate: new Date(o.effectiveDateTime).getTime(), Value: o.valueQuantity.value, unit: o.valueQuantity.unit || '' });
    }
  });

  Object.values(groups).forEach(g => g.sort((a, b) => a.sortDate - b.sortDate));
  const vitalNames = Object.keys(groups).filter(k => groups[k].length >= 2);
  if (vitalNames.length === 0) return null;

  return <>
    <div className="card" style={{marginTop:16}}><div className="card-header"><h2>Vital Signs Over Time</h2></div><div className="card-body">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))',gap:24}}>
        {vitalNames.map(name => {
          const data = groups[name].map(d => ({ ...d, date: fmtDate(d.date) }));
          const isBP = data[0]?.Systolic != null;
          const unit = data[0]?.unit || '';
          return (
            <div key={name}>
              <div style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:8,fontWeight:600}}>{name} {unit && `(${unit})`}</div>
              <ResponsiveContainer width="100%" height={180}>
                {isBP ? (
                  <AreaChart data={data} margin={{top:5,right:10,bottom:5,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
                    <XAxis dataKey="date" tick={{fill:'#8895aa',fontSize:10}} />
                    <YAxis tick={{fill:'#8895aa',fontSize:10}} />
                    <Tooltip content={CT} />
                    <Area type="monotone" dataKey="Systolic" stroke="#f87171" fill="#f8717133" name="Systolic" />
                    <Area type="monotone" dataKey="Diastolic" stroke="#4f8fff" fill="#4f8fff33" name="Diastolic" />
                    <Legend wrapperStyle={{fontSize:'0.7rem'}} />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{top:5,right:10,bottom:5,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3550" />
                    <XAxis dataKey="date" tick={{fill:'#8895aa',fontSize:10}} />
                    <YAxis tick={{fill:'#8895aa',fontSize:10}} />
                    <Tooltip content={CT} />
                    <Line type="monotone" dataKey="Value" stroke="#34d399" strokeWidth={2} dot={{fill:'#34d399',r:3}} name={name} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div></div>
  </>;
}

/* ════════════════════ PATIENT RELATED RESOURCES ════════════════════ */
function PatientRelated({ patientId }) {
  const [related, setRelated] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const types = ['Condition','MedicationRequest','AllergyIntolerance','Immunization','Procedure','Encounter'];
    Promise.all(types.map(t =>
      fhir.search(t, { _count: 100 }).then(b => [t, (b?.entry?.map(e=>e.resource)||[]).filter(r => {
        const ref = r.subject?.reference || r.patient?.reference;
        return ref === `Patient/${patientId}`;
      })]).catch(() => [t, []])
    )).then(results => {
      const obj = {};
      results.forEach(([t, rs]) => { if (rs.length > 0) obj[t] = rs; });
      setRelated(obj);
      setLoading(false);
    });
  }, [patientId]);

  if (loading) return <div className="card" style={{marginTop:16}}><div className="loading-overlay"><div className="spinner" /> Loading related...</div></div>;

  const entries = Object.entries(related);
  if (entries.length === 0) return null;

  return <>
    {entries.map(([type, items]) => {
      const nav = NAV.find(n => n.key === type);
      const cfg = TABLE_CONFIGS[type];
      return (
        <div className="card" key={type} style={{marginTop:16}}>
          <div className="card-header"><h2>{nav?.label || type} ({items.length})</h2></div>
          <div className="table-wrapper">
            <table><thead><tr>{(cfg?.cols||['ID']).map(c=><th key={c}>{c}</th>)}</tr></thead>
            <tbody>{items.slice(0, 20).map(r => {
              let cells; try { cells = cfg?.row(r) || [r.id]; } catch { cells = [r.id]; }
              return <tr key={r.id}>{cells.map((c,i) => <td key={i}>{c}</td>)}</tr>;
            })}</tbody></table>
          </div>
        </div>
      );
    })}
  </>;
}
