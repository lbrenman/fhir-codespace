const express = require('express');
const router = express.Router();

// Conditional store: Postgres if DATABASE_URL is set, otherwise in-memory JSON
const store = process.env.DATABASE_URL
  ? require('../store-pg')
  : require('../store');

// Supported FHIR resource types from the spec
const RESOURCE_TYPES = [
  'Account','AdverseEvent','AllergyIntolerance','Appointment','AppointmentResponse',
  'AuditEvent','Basic','Binary','BiologicallyDerivedProduct','BodyStructure',
  'Bundle','CapabilityStatement','CarePlan','CareTeam','CatalogEntry',
  'ChargeItem','ChargeItemDefinition','Claim','ClaimResponse','ClinicalImpression',
  'CodeSystem','Communication','CommunicationRequest','CompartmentDefinition',
  'Composition','ConceptMap','Condition','Consent','Contract','Coverage',
  'CoverageEligibilityRequest','CoverageEligibilityResponse','DetectedIssue',
  'Device','DeviceDefinition','DeviceMetric','DeviceRequest','DeviceUseStatement',
  'DiagnosticReport','DocumentManifest','DocumentReference','EffectDefinition',
  'Encounter','Endpoint','EnrollmentRequest','EnrollmentResponse',
  'EpisodeOfCare','EventDefinition','Evidence','EvidenceVariable',
  'ExampleScenario','ExplanationOfBenefit','FamilyMemberHistory','Flag',
  'Goal','GraphDefinition','Group','GuidanceResponse','HealthcareService',
  'ImagingStudy','Immunization','ImmunizationEvaluation','ImmunizationRecommendation',
  'ImplementationGuide','InsurancePlan','Invoice','Library','Linkage','List',
  'Location','Measure','MeasureReport','Media','Medication','MedicationAdministration',
  'MedicationDispense','MedicationKnowledge','MedicationRequest','MedicationStatement',
  'MedicinalProduct','MedicinalProductAuthorization','MedicinalProductContraindication',
  'MedicinalProductIndication','MedicinalProductIngredient','MedicinalProductInteraction',
  'MedicinalProductManufactured','MedicinalProductPackaged','MedicinalProductPharmaceutical',
  'MedicinalProductUndesirableEffect','MessageDefinition','MessageHeader',
  'MolecularSequence','NamingSystem','NutritionOrder','Observation',
  'ObservationDefinition','OperationDefinition','OperationOutcome','Organization',
  'OrganizationAffiliation','Parameters','Patient','PaymentNotice',
  'PaymentReconciliation','Person','PlanDefinition','Practitioner',
  'PractitionerRole','Procedure','Provenance','Questionnaire',
  'QuestionnaireResponse','RelatedPerson','RequestGroup','ResearchDefinition',
  'ResearchElementDefinition','ResearchStudy','ResearchSubject','RiskAssessment',
  'RiskEvidenceSynthesis','Schedule','SearchParameter','ServiceRequest',
  'Slot','Specimen','SpecimenDefinition','StructureDefinition','StructureMap',
  'Subscription','Substance','SubstanceNucleicAcid','SubstancePolymer',
  'SubstanceProtein','SubstanceReferenceInformation','SubstanceSourceMaterial',
  'SubstanceSpecification','SupplyDelivery','SupplyRequest','Task',
  'TerminologyCapabilities','TestReport','TestScript','ValueSet',
  'VerificationResult','VisionPrescription',
];

function operationOutcome(severity, code, diagnostics) {
  return {
    resourceType: 'OperationOutcome',
    issue: [{ severity, code, diagnostics }],
  };
}

// ── Search (GET /:resourceType) ──
router.get('/:resourceType', async (req, res) => {
  try {
    const { resourceType } = req.params;
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(404).json(operationOutcome('error', 'not-found', `Unknown resource type: ${resourceType}`));
    }
    const bundle = await store.search(resourceType, req.query);
    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

// ── Read (GET /:resourceType/:id) ──
router.get('/:resourceType/:id', async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(404).json(operationOutcome('error', 'not-found', `Unknown resource type: ${resourceType}`));
    }
    const resource = await store.read(resourceType, id);
    if (!resource) {
      return res.status(404).json(operationOutcome('error', 'not-found', `${resourceType}/${id} not found`));
    }
    res.set('Content-Type', 'application/fhir+json');
    res.set('ETag', `W/"${resource.meta?.versionId || '1'}"`);
    res.set('Last-Modified', resource.meta?.lastUpdated || new Date().toISOString());
    res.json(resource);
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

// ── Create (POST /:resourceType) ──
router.post('/:resourceType', async (req, res) => {
  try {
    const { resourceType } = req.params;
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(404).json(operationOutcome('error', 'not-found', `Unknown resource type: ${resourceType}`));
    }
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json(operationOutcome('error', 'invalid', 'Request body must be a valid JSON resource'));
    }
    const created = await store.create(resourceType, req.body);
    res.status(201);
    res.set('Content-Type', 'application/fhir+json');
    res.set('Location', `/${resourceType}/${created.id}`);
    res.set('ETag', `W/"${created.meta.versionId}"`);
    res.json(created);
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

// ── Update (PUT /:resourceType/:id) ──
router.put('/:resourceType/:id', async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(404).json(operationOutcome('error', 'not-found', `Unknown resource type: ${resourceType}`));
    }
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json(operationOutcome('error', 'invalid', 'Request body must be a valid JSON resource'));
    }
    const { resource, created } = await store.update(resourceType, id, req.body);
    res.status(created ? 201 : 200);
    res.set('Content-Type', 'application/fhir+json');
    res.set('ETag', `W/"${resource.meta.versionId}"`);
    res.set('Last-Modified', resource.meta.lastUpdated);
    res.json(resource);
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

// ── Delete (DELETE /:resourceType/:id) ──
router.delete('/:resourceType/:id', async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(404).json(operationOutcome('error', 'not-found', `Unknown resource type: ${resourceType}`));
    }
    const deleted = await store.delete(resourceType, id);
    if (!deleted) {
      return res.status(404).json(operationOutcome('error', 'not-found', `${resourceType}/${id} not found`));
    }
    res.status(204).send();
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

// ── Stats endpoint (custom) ──
router.get('/_stats', async (req, res) => {
  try {
    res.json(await store.getStats());
  } catch (e) {
    res.status(500).json(operationOutcome('error', 'exception', e.message));
  }
});

module.exports = router;
