-- ============================================================
-- FHIR R4 PostgreSQL Schema
-- All tables prefixed with FHIR_
-- Run: psql -d your_db -f 001-schema.sql
-- ============================================================

-- Clean slate (drop in reverse dependency order)
DROP TABLE IF EXISTS FHIR_Appointment_Participant CASCADE;
DROP TABLE IF EXISTS FHIR_Observation_Component CASCADE;
DROP TABLE IF EXISTS FHIR_Appointment CASCADE;
DROP TABLE IF EXISTS FHIR_Claim CASCADE;
DROP TABLE IF EXISTS FHIR_DiagnosticReport CASCADE;
DROP TABLE IF EXISTS FHIR_Procedure CASCADE;
DROP TABLE IF EXISTS FHIR_Immunization CASCADE;
DROP TABLE IF EXISTS FHIR_AllergyIntolerance CASCADE;
DROP TABLE IF EXISTS FHIR_MedicationRequest CASCADE;
DROP TABLE IF EXISTS FHIR_Observation CASCADE;
DROP TABLE IF EXISTS FHIR_Condition CASCADE;
DROP TABLE IF EXISTS FHIR_Encounter CASCADE;
DROP TABLE IF EXISTS FHIR_Patient CASCADE;
DROP TABLE IF EXISTS FHIR_Practitioner CASCADE;
DROP TABLE IF EXISTS FHIR_Location CASCADE;
DROP TABLE IF EXISTS FHIR_Organization CASCADE;

-- ============================================================
-- ADMINISTRATIVE RESOURCES
-- ============================================================

CREATE TABLE FHIR_Organization (
    id                  VARCHAR(64) PRIMARY KEY,
    active              BOOLEAN DEFAULT TRUE,
    name                VARCHAR(255) NOT NULL,
    type_code           VARCHAR(64),
    type_display        VARCHAR(255),
    phone               VARCHAR(32),
    city                VARCHAR(128),
    state               VARCHAR(32),
    country             VARCHAR(8) DEFAULT 'US',
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE TABLE FHIR_Practitioner (
    id                  VARCHAR(64) PRIMARY KEY,
    active              BOOLEAN DEFAULT TRUE,
    family_name         VARCHAR(128),
    given_name          VARCHAR(128),
    full_name           VARCHAR(255) GENERATED ALWAYS AS (
                            COALESCE(given_name, '') || ' ' || COALESCE(family_name, '')
                        ) STORED,
    gender              VARCHAR(16),
    phone               VARCHAR(32),
    specialty           VARCHAR(255),
    qualification_code  VARCHAR(16),
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE TABLE FHIR_Location (
    id                  VARCHAR(64) PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    status              VARCHAR(16) DEFAULT 'active',
    mode                VARCHAR(16) DEFAULT 'instance',
    type_code           VARCHAR(16),
    organization_id     VARCHAR(64) REFERENCES FHIR_Organization(id),
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

-- ============================================================
-- PATIENT
-- ============================================================

CREATE TABLE FHIR_Patient (
    id                      VARCHAR(64) PRIMARY KEY,
    active                  BOOLEAN DEFAULT TRUE,
    family_name             VARCHAR(128),
    given_name              VARCHAR(128),
    full_name               VARCHAR(255) GENERATED ALWAYS AS (
                                COALESCE(given_name, '') || ' ' || COALESCE(family_name, '')
                            ) STORED,
    gender                  VARCHAR(16),
    birth_date              DATE,
    mrn                     VARCHAR(64),
    phone                   VARCHAR(32),
    city                    VARCHAR(128),
    state                   VARCHAR(32),
    country                 VARCHAR(8) DEFAULT 'US',
    organization_id         VARCHAR(64) REFERENCES FHIR_Organization(id),
    general_practitioner_id VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    version_id              VARCHAR(16) DEFAULT '1',
    last_updated            TIMESTAMPTZ DEFAULT NOW(),
    resource_json           JSONB NOT NULL
);

CREATE INDEX idx_patient_name ON FHIR_Patient (family_name, given_name);
CREATE INDEX idx_patient_gender ON FHIR_Patient (gender);
CREATE INDEX idx_patient_birth_date ON FHIR_Patient (birth_date);
CREATE INDEX idx_patient_mrn ON FHIR_Patient (mrn);
CREATE INDEX idx_patient_org ON FHIR_Patient (organization_id);

-- ============================================================
-- CLINICAL RESOURCES
-- ============================================================

CREATE TABLE FHIR_Encounter (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) NOT NULL,
    class_code          VARCHAR(16),
    class_display       VARCHAR(64),
    type_text           VARCHAR(128),
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    practitioner_id     VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    period_start        DATE,
    period_end          DATE,
    organization_id     VARCHAR(64) REFERENCES FHIR_Organization(id),
    location_id         VARCHAR(64) REFERENCES FHIR_Location(id),
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_encounter_patient ON FHIR_Encounter (patient_id);
CREATE INDEX idx_encounter_status ON FHIR_Encounter (status);
CREATE INDEX idx_encounter_date ON FHIR_Encounter (period_start);

CREATE TABLE FHIR_Condition (
    id                      VARCHAR(64) PRIMARY KEY,
    clinical_status         VARCHAR(32),
    verification_status     VARCHAR(32),
    category_code           VARCHAR(64),
    code_system             VARCHAR(255),
    code_code               VARCHAR(32),
    code_display            VARCHAR(255),
    patient_id              VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display         VARCHAR(255),
    encounter_id            VARCHAR(64) REFERENCES FHIR_Encounter(id),
    onset_date              DATE,
    recorded_date           DATE,
    version_id              VARCHAR(16) DEFAULT '1',
    last_updated            TIMESTAMPTZ DEFAULT NOW(),
    resource_json           JSONB NOT NULL
);

CREATE INDEX idx_condition_patient ON FHIR_Condition (patient_id);
CREATE INDEX idx_condition_code ON FHIR_Condition (code_code);
CREATE INDEX idx_condition_status ON FHIR_Condition (clinical_status);
CREATE INDEX idx_condition_onset ON FHIR_Condition (onset_date);

CREATE TABLE FHIR_Observation (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(16) DEFAULT 'final',
    category_code       VARCHAR(32),
    code_system         VARCHAR(255),
    code_code           VARCHAR(32),
    code_display        VARCHAR(255),
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    effective_date      TIMESTAMPTZ,
    value_quantity      NUMERIC(10,2),
    value_unit          VARCHAR(32),
    value_string        TEXT,
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_observation_patient ON FHIR_Observation (patient_id);
CREATE INDEX idx_observation_code ON FHIR_Observation (code_code);
CREATE INDEX idx_observation_date ON FHIR_Observation (effective_date);
CREATE INDEX idx_observation_patient_code ON FHIR_Observation (patient_id, code_code);
CREATE INDEX idx_observation_patient_date ON FHIR_Observation (patient_id, effective_date);

-- Blood pressure and other multi-component observations
CREATE TABLE FHIR_Observation_Component (
    id                  SERIAL PRIMARY KEY,
    observation_id      VARCHAR(64) NOT NULL REFERENCES FHIR_Observation(id) ON DELETE CASCADE,
    code_system         VARCHAR(255),
    code_code           VARCHAR(32),
    code_display        VARCHAR(255),
    value_quantity      NUMERIC(10,2),
    value_unit          VARCHAR(32)
);

CREATE INDEX idx_obs_component_obs ON FHIR_Observation_Component (observation_id);

CREATE TABLE FHIR_MedicationRequest (
    id                      VARCHAR(64) PRIMARY KEY,
    status                  VARCHAR(32) NOT NULL,
    intent                  VARCHAR(32) DEFAULT 'order',
    medication_system       VARCHAR(255),
    medication_code         VARCHAR(32),
    medication_display      VARCHAR(255),
    patient_id              VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display         VARCHAR(255),
    authored_on             DATE,
    requester_id            VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    dosage_text             TEXT,
    version_id              VARCHAR(16) DEFAULT '1',
    last_updated            TIMESTAMPTZ DEFAULT NOW(),
    resource_json           JSONB NOT NULL
);

CREATE INDEX idx_medreq_patient ON FHIR_MedicationRequest (patient_id);
CREATE INDEX idx_medreq_status ON FHIR_MedicationRequest (status);
CREATE INDEX idx_medreq_date ON FHIR_MedicationRequest (authored_on);
CREATE INDEX idx_medreq_medication ON FHIR_MedicationRequest (medication_code);

CREATE TABLE FHIR_AllergyIntolerance (
    id                      VARCHAR(64) PRIMARY KEY,
    clinical_status         VARCHAR(32),
    verification_status     VARCHAR(32),
    type                    VARCHAR(32),
    category                VARCHAR(32),
    criticality             VARCHAR(32),
    code_system             VARCHAR(255),
    code_code               VARCHAR(32),
    code_display            VARCHAR(255),
    patient_id              VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display         VARCHAR(255),
    recorded_date           DATE,
    reaction_manifestation  VARCHAR(255),
    reaction_severity       VARCHAR(32),
    version_id              VARCHAR(16) DEFAULT '1',
    last_updated            TIMESTAMPTZ DEFAULT NOW(),
    resource_json           JSONB NOT NULL
);

CREATE INDEX idx_allergy_patient ON FHIR_AllergyIntolerance (patient_id);
CREATE INDEX idx_allergy_criticality ON FHIR_AllergyIntolerance (criticality);

CREATE TABLE FHIR_Immunization (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) DEFAULT 'completed',
    vaccine_system      VARCHAR(255),
    vaccine_code        VARCHAR(32),
    vaccine_display     VARCHAR(255),
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    occurrence_date     DATE,
    performer_id        VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_immunization_patient ON FHIR_Immunization (patient_id);
CREATE INDEX idx_immunization_date ON FHIR_Immunization (occurrence_date);

CREATE TABLE FHIR_Procedure (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) NOT NULL,
    code_system         VARCHAR(255),
    code_code           VARCHAR(32),
    code_display        VARCHAR(255),
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    encounter_id        VARCHAR(64) REFERENCES FHIR_Encounter(id),
    performed_date      DATE,
    performer_id        VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_procedure_patient ON FHIR_Procedure (patient_id);
CREATE INDEX idx_procedure_code ON FHIR_Procedure (code_code);
CREATE INDEX idx_procedure_date ON FHIR_Procedure (performed_date);

CREATE TABLE FHIR_Appointment (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) NOT NULL,
    service_type        VARCHAR(128),
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,
    minutes_duration    INTEGER,
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_appointment_status ON FHIR_Appointment (status);
CREATE INDEX idx_appointment_start ON FHIR_Appointment (start_time);

CREATE TABLE FHIR_Appointment_Participant (
    id                  SERIAL PRIMARY KEY,
    appointment_id      VARCHAR(64) NOT NULL REFERENCES FHIR_Appointment(id) ON DELETE CASCADE,
    actor_reference     VARCHAR(128),
    actor_display       VARCHAR(255),
    actor_type          VARCHAR(32),  -- 'Patient', 'Practitioner', etc.
    status              VARCHAR(32) DEFAULT 'accepted'
);

CREATE INDEX idx_appt_part_appt ON FHIR_Appointment_Participant (appointment_id);
CREATE INDEX idx_appt_part_actor ON FHIR_Appointment_Participant (actor_reference);

CREATE TABLE FHIR_Claim (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) NOT NULL,
    type_code           VARCHAR(32),
    type_display        VARCHAR(128),
    use                 VARCHAR(32) DEFAULT 'claim',
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    created             DATE,
    provider_id         VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    priority            VARCHAR(16) DEFAULT 'normal',
    total_value         NUMERIC(12,2),
    total_currency      VARCHAR(8) DEFAULT 'USD',
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_claim_patient ON FHIR_Claim (patient_id);
CREATE INDEX idx_claim_status ON FHIR_Claim (status);
CREATE INDEX idx_claim_created ON FHIR_Claim (created);

CREATE TABLE FHIR_DiagnosticReport (
    id                  VARCHAR(64) PRIMARY KEY,
    status              VARCHAR(32) NOT NULL,
    category_code       VARCHAR(32),
    category_display    VARCHAR(128),
    code_system         VARCHAR(255),
    code_code           VARCHAR(32),
    code_display        VARCHAR(255),
    patient_id          VARCHAR(64) NOT NULL REFERENCES FHIR_Patient(id),
    patient_display     VARCHAR(255),
    effective_date      DATE,
    issued              TIMESTAMPTZ,
    performer_id        VARCHAR(64) REFERENCES FHIR_Practitioner(id),
    conclusion          TEXT,
    version_id          VARCHAR(16) DEFAULT '1',
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    resource_json       JSONB NOT NULL
);

CREATE INDEX idx_diagreport_patient ON FHIR_DiagnosticReport (patient_id);
CREATE INDEX idx_diagreport_code ON FHIR_DiagnosticReport (code_code);
CREATE INDEX idx_diagreport_date ON FHIR_DiagnosticReport (effective_date);

-- ============================================================
-- SUMMARY VIEW: Patient with counts of all related resources
-- ============================================================

CREATE OR REPLACE VIEW FHIR_Patient_Summary AS
SELECT
    p.id,
    p.full_name,
    p.gender,
    p.birth_date,
    p.mrn,
    p.phone,
    p.city,
    p.state,
    o.name AS organization_name,
    pr.full_name AS practitioner_name,
    (SELECT COUNT(*) FROM FHIR_Encounter e WHERE e.patient_id = p.id) AS encounter_count,
    (SELECT COUNT(*) FROM FHIR_Condition c WHERE c.patient_id = p.id) AS condition_count,
    (SELECT COUNT(*) FROM FHIR_Observation ob WHERE ob.patient_id = p.id) AS observation_count,
    (SELECT COUNT(*) FROM FHIR_MedicationRequest mr WHERE mr.patient_id = p.id) AS medication_count,
    (SELECT COUNT(*) FROM FHIR_AllergyIntolerance a WHERE a.patient_id = p.id) AS allergy_count,
    (SELECT COUNT(*) FROM FHIR_Immunization im WHERE im.patient_id = p.id) AS immunization_count,
    (SELECT COUNT(*) FROM FHIR_Procedure pr WHERE pr.patient_id = p.id) AS procedure_count,
    (SELECT COUNT(*) FROM FHIR_Claim cl WHERE cl.patient_id = p.id) AS claim_count,
    (SELECT COUNT(*) FROM FHIR_DiagnosticReport dr WHERE dr.patient_id = p.id) AS diagnostic_count
FROM FHIR_Patient p
LEFT JOIN FHIR_Organization o ON p.organization_id = o.id
LEFT JOIN FHIR_Practitioner pr ON p.general_practitioner_id = pr.id
ORDER BY p.family_name, p.given_name;

-- ============================================================
-- Done
-- ============================================================
