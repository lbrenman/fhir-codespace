-- ============================================================
-- FHIR R4 PostgreSQL Stored Procedures
-- Run after 001-schema.sql and 003-seed-data.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Search patients by name (partial match, case-insensitive)
-- Usage: SELECT * FROM fhir_search_patients('thompson');
--        SELECT * FROM fhir_search_patients('mar', 'female');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_search_patients(
    p_name TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id VARCHAR, full_name VARCHAR, gender VARCHAR,
    birth_date DATE, mrn VARCHAR, phone VARCHAR,
    city VARCHAR, state VARCHAR, organization VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.full_name, p.gender,
           p.birth_date, p.mrn, p.phone,
           p.city, p.state, o.name
    FROM FHIR_Patient p
    LEFT JOIN FHIR_Organization o ON p.organization_id = o.id
    WHERE (p_name IS NULL OR p.full_name ILIKE '%' || p_name || '%')
      AND (p_gender IS NULL OR p.gender = p_gender)
    ORDER BY p.family_name, p.given_name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 2. Get full patient record with all related resource counts
-- Usage: SELECT * FROM fhir_patient_summary('pat-001');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_patient_summary(p_patient_id VARCHAR)
RETURNS TABLE (
    patient_id VARCHAR, full_name VARCHAR, gender VARCHAR,
    birth_date DATE, age INT, mrn VARCHAR,
    organization VARCHAR, practitioner VARCHAR,
    encounters BIGINT, conditions BIGINT, observations BIGINT,
    medications BIGINT, allergies BIGINT, immunizations BIGINT,
    procedures BIGINT, claims BIGINT, total_claims NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.full_name, p.gender,
        p.birth_date,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date))::INT,
        p.mrn,
        o.name,
        pr.full_name,
        (SELECT COUNT(*) FROM FHIR_Encounter WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_Condition WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_Observation WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_MedicationRequest WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_AllergyIntolerance WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_Immunization WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_Procedure WHERE patient_id = p.id),
        (SELECT COUNT(*) FROM FHIR_Claim WHERE patient_id = p.id),
        (SELECT COALESCE(SUM(total_value), 0) FROM FHIR_Claim WHERE patient_id = p.id)
    FROM FHIR_Patient p
    LEFT JOIN FHIR_Organization o ON p.organization_id = o.id
    LEFT JOIN FHIR_Practitioner pr ON p.general_practitioner_id = pr.id
    WHERE p.id = p_patient_id;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 3. Get patient vital signs over time (for charting)
-- Usage: SELECT * FROM fhir_patient_vitals('pat-001');
--        SELECT * FROM fhir_patient_vitals('pat-001', 'Heart rate');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_patient_vitals(
    p_patient_id VARCHAR,
    p_vital_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    observation_date TIMESTAMPTZ, vital_name VARCHAR,
    loinc_code VARCHAR, value NUMERIC, unit VARCHAR,
    systolic NUMERIC, diastolic NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        -- Simple value observations (heart rate, temp, etc.)
        SELECT o.effective_date, o.code_display, o.code_code,
               o.value_quantity, o.value_unit,
               NULL::NUMERIC, NULL::NUMERIC
        FROM FHIR_Observation o
        WHERE o.patient_id = p_patient_id
          AND o.category_code = 'vital-signs'
          AND o.value_quantity IS NOT NULL
          AND (p_vital_name IS NULL OR o.code_display ILIKE '%' || p_vital_name || '%')

        UNION ALL

        -- Blood pressure (component observations)
        SELECT o.effective_date, o.code_display, o.code_code,
               NULL, NULL,
               MAX(CASE WHEN oc.code_code = '8480-6' THEN oc.value_quantity END),
               MAX(CASE WHEN oc.code_code = '8462-4' THEN oc.value_quantity END)
        FROM FHIR_Observation o
        JOIN FHIR_Observation_Component oc ON oc.observation_id = o.id
        WHERE o.patient_id = p_patient_id
          AND o.category_code = 'vital-signs'
          AND o.value_quantity IS NULL
          AND (p_vital_name IS NULL OR o.code_display ILIKE '%' || p_vital_name || '%')
        GROUP BY o.effective_date, o.code_display, o.code_code
    ) sub
    ORDER BY code_display, effective_date;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 4. Search appointments by date range (FHIR-style ge/le)
-- Usage: SELECT * FROM fhir_search_appointments('2026-01-01', '2026-12-31');
--        SELECT * FROM fhir_search_appointments(p_patient_id := 'pat-001');
--        SELECT * FROM fhir_search_appointments('2025-06-01', '2025-12-31', 'pat-001', 'booked');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_search_appointments(
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_patient_id VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR, status VARCHAR, service_type VARCHAR,
    start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
    minutes_duration INT, patient_name VARCHAR, practitioner_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.status, a.service_type,
           a.start_time, a.end_time, a.minutes_duration,
           pp.actor_display,
           pr.actor_display
    FROM FHIR_Appointment a
    LEFT JOIN FHIR_Appointment_Participant pp
        ON pp.appointment_id = a.id AND pp.actor_type = 'Patient'
    LEFT JOIN FHIR_Appointment_Participant pr
        ON pr.appointment_id = a.id AND pr.actor_type = 'Practitioner'
    WHERE (p_date_from IS NULL OR a.start_time >= p_date_from)
      AND (p_date_to IS NULL OR a.start_time <= p_date_to + INTERVAL '1 day')
      AND (p_status IS NULL OR a.status = p_status)
      AND (p_patient_id IS NULL OR pp.actor_reference = 'Patient/' || p_patient_id)
    ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 5. Get patient's active medications
-- Usage: SELECT * FROM fhir_active_medications('pat-001');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_active_medications(p_patient_id VARCHAR)
RETURNS TABLE (
    id VARCHAR, medication VARCHAR, medication_code VARCHAR,
    status VARCHAR, intent VARCHAR, authored_on DATE,
    prescriber VARCHAR, dosage TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT mr.id, mr.medication_display, mr.medication_code,
           mr.status, mr.intent, mr.authored_on,
           pr.full_name, mr.dosage_text
    FROM FHIR_MedicationRequest mr
    LEFT JOIN FHIR_Practitioner pr ON mr.requester_id = pr.id
    WHERE mr.patient_id = p_patient_id
      AND mr.status = 'active'
    ORDER BY mr.authored_on DESC;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 5b. Get medications by patient name (partial match)
--     with optional status filter
-- Usage: SELECT * FROM fhir_medications_by_patient_name('Margaret');
--        SELECT * FROM fhir_medications_by_patient_name('Thompson', 'active');
--        SELECT * FROM fhir_medications_by_patient_name('Mar');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_medications_by_patient_name(
    p_patient_name TEXT,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    patient_id VARCHAR, patient_name VARCHAR,
    medication_id VARCHAR, medication VARCHAR, medication_code VARCHAR,
    status VARCHAR, intent VARCHAR, authored_on DATE,
    prescriber VARCHAR, dosage TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.full_name,
           mr.id, mr.medication_display, mr.medication_code,
           mr.status, mr.intent, mr.authored_on,
           pr.full_name, mr.dosage_text
    FROM FHIR_MedicationRequest mr
    JOIN FHIR_Patient p ON mr.patient_id = p.id
    LEFT JOIN FHIR_Practitioner pr ON mr.requester_id = pr.id
    WHERE p.full_name ILIKE '%' || p_patient_name || '%'
      AND (p_status IS NULL OR mr.status = p_status)
    ORDER BY p.full_name, mr.authored_on DESC;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 6. Get patient's conditions by clinical status
-- Usage: SELECT * FROM fhir_patient_conditions('pat-001');
--        SELECT * FROM fhir_patient_conditions('pat-001', 'active');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_patient_conditions(
    p_patient_id VARCHAR,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR, condition_name VARCHAR, icd10_code VARCHAR,
    clinical_status VARCHAR, verification VARCHAR,
    onset_date DATE, recorded_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.code_display, c.code_code,
           c.clinical_status, c.verification_status,
           c.onset_date, c.recorded_date
    FROM FHIR_Condition c
    WHERE c.patient_id = p_patient_id
      AND (p_status IS NULL OR c.clinical_status = p_status)
    ORDER BY c.onset_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 7. Get patient's allergies
-- Usage: SELECT * FROM fhir_patient_allergies('pat-001');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_patient_allergies(p_patient_id VARCHAR)
RETURNS TABLE (
    id VARCHAR, substance VARCHAR, category VARCHAR,
    criticality VARCHAR, reaction VARCHAR,
    severity VARCHAR, recorded_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.code_display, a.category,
           a.criticality, a.reaction_manifestation,
           a.reaction_severity, a.recorded_date
    FROM FHIR_AllergyIntolerance a
    WHERE a.patient_id = p_patient_id
    ORDER BY a.criticality DESC, a.recorded_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 8. Search observations by patient, code, and date range
-- Usage: SELECT * FROM fhir_search_observations('pat-001', '8867-4');
--        SELECT * FROM fhir_search_observations(p_patient_id := 'pat-001',
--            p_date_from := '2025-01-01', p_date_to := '2025-12-31');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_search_observations(
    p_patient_id VARCHAR DEFAULT NULL,
    p_code VARCHAR DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_limit INT DEFAULT 500
)
RETURNS TABLE (
    id VARCHAR, patient_id VARCHAR, patient_name VARCHAR,
    observation VARCHAR, loinc_code VARCHAR,
    value NUMERIC, unit VARCHAR, effective_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.patient_id, o.patient_display,
           o.code_display, o.code_code,
           o.value_quantity, o.value_unit, o.effective_date
    FROM FHIR_Observation o
    WHERE (p_patient_id IS NULL OR o.patient_id = p_patient_id)
      AND (p_code IS NULL OR o.code_code = p_code)
      AND (p_date_from IS NULL OR o.effective_date >= p_date_from)
      AND (p_date_to IS NULL OR o.effective_date <= p_date_to + INTERVAL '1 day')
    ORDER BY o.effective_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 9. Dashboard stats — resource counts
-- Usage: SELECT * FROM fhir_dashboard_stats();
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_dashboard_stats()
RETURNS TABLE (resource_type TEXT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT 'Patient'::TEXT, COUNT(*) FROM FHIR_Patient
        UNION ALL SELECT 'Encounter', COUNT(*) FROM FHIR_Encounter
        UNION ALL SELECT 'Condition', COUNT(*) FROM FHIR_Condition
        UNION ALL SELECT 'Observation', COUNT(*) FROM FHIR_Observation
        UNION ALL SELECT 'MedicationRequest', COUNT(*) FROM FHIR_MedicationRequest
        UNION ALL SELECT 'AllergyIntolerance', COUNT(*) FROM FHIR_AllergyIntolerance
        UNION ALL SELECT 'Immunization', COUNT(*) FROM FHIR_Immunization
        UNION ALL SELECT 'Procedure', COUNT(*) FROM FHIR_Procedure
        UNION ALL SELECT 'Appointment', COUNT(*) FROM FHIR_Appointment
        UNION ALL SELECT 'Claim', COUNT(*) FROM FHIR_Claim
        UNION ALL SELECT 'DiagnosticReport', COUNT(*) FROM FHIR_DiagnosticReport
        UNION ALL SELECT 'Organization', COUNT(*) FROM FHIR_Organization
        UNION ALL SELECT 'Practitioner', COUNT(*) FROM FHIR_Practitioner
        UNION ALL SELECT 'Location', COUNT(*) FROM FHIR_Location
    ) sub(resource_type, total)
    ORDER BY resource_type;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 10. Get the latest observation value per vital type for a patient
--     (useful for "current vitals" display)
-- Usage: SELECT * FROM fhir_latest_vitals('pat-001');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_latest_vitals(p_patient_id VARCHAR)
RETURNS TABLE (
    vital_name VARCHAR, loinc_code VARCHAR,
    value NUMERIC, unit VARCHAR,
    systolic NUMERIC, diastolic NUMERIC,
    measured_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked AS (
        -- Simple value observations
        SELECT o.code_display, o.code_code,
               o.value_quantity AS val, o.value_unit,
               NULL::NUMERIC AS sys, NULL::NUMERIC AS dia,
               o.effective_date,
               ROW_NUMBER() OVER (PARTITION BY o.code_code ORDER BY o.effective_date DESC) AS rn
        FROM FHIR_Observation o
        WHERE o.patient_id = p_patient_id
          AND o.category_code = 'vital-signs'
          AND o.value_quantity IS NOT NULL

        UNION ALL

        -- Blood pressure
        SELECT o.code_display, o.code_code,
               NULL, NULL,
               MAX(CASE WHEN oc.code_code = '8480-6' THEN oc.value_quantity END),
               MAX(CASE WHEN oc.code_code = '8462-4' THEN oc.value_quantity END),
               o.effective_date,
               ROW_NUMBER() OVER (PARTITION BY o.code_code ORDER BY o.effective_date DESC) AS rn
        FROM FHIR_Observation o
        JOIN FHIR_Observation_Component oc ON oc.observation_id = o.id
        WHERE o.patient_id = p_patient_id
          AND o.category_code = 'vital-signs'
          AND o.value_quantity IS NULL
        GROUP BY o.id, o.code_display, o.code_code, o.effective_date
    )
    SELECT r.code_display, r.code_code, r.val, r.value_unit,
           r.sys, r.dia, r.effective_date
    FROM ranked r
    WHERE r.rn = 1
    ORDER BY r.code_display;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 11. Full-text search across all resource JSON
-- Usage: SELECT * FROM fhir_fulltext_search('Margaret');
--        SELECT * FROM fhir_fulltext_search('Sertraline', 'MedicationRequest');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_fulltext_search(
    p_term TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (resource_type TEXT, resource_id VARCHAR, match_context TEXT) AS $$
BEGIN
    IF p_resource_type IS NULL OR p_resource_type = 'Patient' THEN
        RETURN QUERY SELECT 'Patient'::TEXT, id, full_name::TEXT
        FROM FHIR_Patient WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'Encounter' THEN
        RETURN QUERY SELECT 'Encounter'::TEXT, id, patient_display::TEXT
        FROM FHIR_Encounter WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'Condition' THEN
        RETURN QUERY SELECT 'Condition'::TEXT, id, code_display::TEXT
        FROM FHIR_Condition WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'Observation' THEN
        RETURN QUERY SELECT 'Observation'::TEXT, id, code_display::TEXT
        FROM FHIR_Observation WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'MedicationRequest' THEN
        RETURN QUERY SELECT 'MedicationRequest'::TEXT, id, medication_display::TEXT
        FROM FHIR_MedicationRequest WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'AllergyIntolerance' THEN
        RETURN QUERY SELECT 'AllergyIntolerance'::TEXT, id, code_display::TEXT
        FROM FHIR_AllergyIntolerance WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'Immunization' THEN
        RETURN QUERY SELECT 'Immunization'::TEXT, id, vaccine_display::TEXT
        FROM FHIR_Immunization WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
    IF p_resource_type IS NULL OR p_resource_type = 'Appointment' THEN
        RETURN QUERY SELECT 'Appointment'::TEXT, id, service_type::TEXT
        FROM FHIR_Appointment WHERE resource_json::TEXT ILIKE '%' || p_term || '%' LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 12. Patient encounter timeline
-- Usage: SELECT * FROM fhir_patient_timeline('pat-001');
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fhir_patient_timeline(p_patient_id VARCHAR)
RETURNS TABLE (
    event_date DATE, event_type TEXT, description TEXT, status TEXT, resource_id VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT e.period_start, 'Encounter'::TEXT, e.type_text::TEXT, e.status::TEXT, e.id
        FROM FHIR_Encounter e WHERE e.patient_id = p_patient_id
        UNION ALL
        SELECT c.onset_date, 'Condition', c.code_display::TEXT, c.clinical_status::TEXT, c.id
        FROM FHIR_Condition c WHERE c.patient_id = p_patient_id
        UNION ALL
        SELECT mr.authored_on, 'Medication', mr.medication_display::TEXT, mr.status::TEXT, mr.id
        FROM FHIR_MedicationRequest mr WHERE mr.patient_id = p_patient_id
        UNION ALL
        SELECT p.performed_date, 'Procedure', p.code_display::TEXT, p.status::TEXT, p.id
        FROM FHIR_Procedure p WHERE p.patient_id = p_patient_id
        UNION ALL
        SELECT im.occurrence_date, 'Immunization', im.vaccine_display::TEXT, im.status::TEXT, im.id
        FROM FHIR_Immunization im WHERE im.patient_id = p_patient_id
        UNION ALL
        SELECT a.start_time::DATE, 'Appointment', a.service_type::TEXT, a.status::TEXT, a.id
        FROM FHIR_Appointment a
        JOIN FHIR_Appointment_Participant ap ON ap.appointment_id = a.id
        WHERE ap.actor_reference = 'Patient/' || p_patient_id
    ) sub
    ORDER BY event_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
