-- ============================================================
-- FHIR R4 PostgreSQL Validation Queries
-- Run after 001-schema.sql, 003-seed-data.sql, 002-stored-procedures.sql
-- Usage: psql -d your_db -f 004-validate.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Verify row counts per table
-- ────────────────────────────────────────────────────────────
\echo '═══ 1. Row counts (expected totals in comments) ═══'
SELECT 'FHIR_Organization' AS table_name, COUNT(*) AS rows FROM FHIR_Organization          -- 5
UNION ALL SELECT 'FHIR_Practitioner',       COUNT(*) FROM FHIR_Practitioner                -- 8
UNION ALL SELECT 'FHIR_Location',           COUNT(*) FROM FHIR_Location                    -- 6
UNION ALL SELECT 'FHIR_Patient',            COUNT(*) FROM FHIR_Patient                     -- 25
UNION ALL SELECT 'FHIR_Encounter',          COUNT(*) FROM FHIR_Encounter                   -- 80
UNION ALL SELECT 'FHIR_Condition',          COUNT(*) FROM FHIR_Condition                   -- 50
UNION ALL SELECT 'FHIR_Observation',        COUNT(*) FROM FHIR_Observation                 -- 750
UNION ALL SELECT 'FHIR_Observation_Component', COUNT(*) FROM FHIR_Observation_Component    -- 180
UNION ALL SELECT 'FHIR_MedicationRequest',  COUNT(*) FROM FHIR_MedicationRequest           -- 55
UNION ALL SELECT 'FHIR_AllergyIntolerance', COUNT(*) FROM FHIR_AllergyIntolerance          -- 27
UNION ALL SELECT 'FHIR_Immunization',       COUNT(*) FROM FHIR_Immunization                -- 56
UNION ALL SELECT 'FHIR_Procedure',          COUNT(*) FROM FHIR_Procedure                   -- 40
UNION ALL SELECT 'FHIR_Appointment',        COUNT(*) FROM FHIR_Appointment                 -- 15
UNION ALL SELECT 'FHIR_Appointment_Participant', COUNT(*) FROM FHIR_Appointment_Participant -- 30
UNION ALL SELECT 'FHIR_Claim',              COUNT(*) FROM FHIR_Claim                       -- 10
UNION ALL SELECT 'FHIR_DiagnosticReport',   COUNT(*) FROM FHIR_DiagnosticReport            -- 12
ORDER BY table_name;

-- ────────────────────────────────────────────────────────────
-- 2. Verify foreign key integrity
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 2. Foreign key integrity (all should return 0) ═══'
SELECT 'Patients with invalid org' AS check_name,
       COUNT(*) AS orphans
FROM FHIR_Patient p
WHERE p.organization_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM FHIR_Organization o WHERE o.id = p.organization_id)

UNION ALL
SELECT 'Encounters with invalid patient',
       COUNT(*)
FROM FHIR_Encounter e
WHERE NOT EXISTS (SELECT 1 FROM FHIR_Patient p WHERE p.id = e.patient_id)

UNION ALL
SELECT 'Observations with invalid patient',
       COUNT(*)
FROM FHIR_Observation o
WHERE NOT EXISTS (SELECT 1 FROM FHIR_Patient p WHERE p.id = o.patient_id)

UNION ALL
SELECT 'Claims with invalid patient',
       COUNT(*)
FROM FHIR_Claim c
WHERE NOT EXISTS (SELECT 1 FROM FHIR_Patient p WHERE p.id = c.patient_id);

-- ────────────────────────────────────────────────────────────
-- 3. Sample patient list
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 3. First 10 patients ═══'
SELECT id, full_name, gender, birth_date, mrn, city, state
FROM FHIR_Patient
ORDER BY family_name, given_name
LIMIT 10;

-- ────────────────────────────────────────────────────────────
-- 4. Patient summary view
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 4. Patient summary view (first 5) ═══'
SELECT id, full_name, organization_name, practitioner_name,
       encounter_count, condition_count, observation_count,
       medication_count, allergy_count, immunization_count
FROM FHIR_Patient_Summary
LIMIT 5;

-- ────────────────────────────────────────────────────────────
-- 5. Stored procedure: search patients by name
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 5. Search patients by name "thompson" ═══'
SELECT * FROM fhir_search_patients('thompson');

-- ────────────────────────────────────────────────────────────
-- 6. Stored procedure: patient summary
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 6. Patient summary for pat-001 ═══'
SELECT * FROM fhir_patient_summary('pat-001');

-- ────────────────────────────────────────────────────────────
-- 7. Stored procedure: patient vitals
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 7. Vitals for pat-001 (first 15 rows) ═══'
SELECT * FROM fhir_patient_vitals('pat-001') LIMIT 15;

-- ────────────────────────────────────────────────────────────
-- 8. Stored procedure: latest vitals
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 8. Latest vitals for pat-001 ═══'
SELECT * FROM fhir_latest_vitals('pat-001');

-- ────────────────────────────────────────────────────────────
-- 9. Stored procedure: active medications
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 9. Active medications for pat-001 ═══'
SELECT * FROM fhir_active_medications('pat-001');

\echo ''
\echo '═══ 9b. Medications by patient name "Margaret" (active only) ═══'
SELECT * FROM fhir_medications_by_patient_name('Margaret', 'active');

\echo ''
\echo '═══ 9c. All medications by patient name "Thompson" ═══'
SELECT * FROM fhir_medications_by_patient_name('Thompson');

-- ────────────────────────────────────────────────────────────
-- 10. Stored procedure: conditions
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 10. Active conditions for pat-001 ═══'
SELECT * FROM fhir_patient_conditions('pat-001', 'active');

-- ────────────────────────────────────────────────────────────
-- 11. Stored procedure: allergies
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 11. Allergies for pat-001 ═══'
SELECT * FROM fhir_patient_allergies('pat-001');

-- ────────────────────────────────────────────────────────────
-- 12. Stored procedure: appointments by date range
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 12. Appointments in 2026 ═══'
SELECT * FROM fhir_search_appointments('2026-01-01', '2026-12-31');

-- ────────────────────────────────────────────────────────────
-- 13. Stored procedure: observations by patient + date
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 13. Observations for pat-001 in 2025 (first 10) ═══'
SELECT * FROM fhir_search_observations('pat-001', NULL, '2025-01-01', '2025-12-31', 10);

-- ────────────────────────────────────────────────────────────
-- 14. Stored procedure: dashboard stats
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 14. Dashboard stats ═══'
SELECT * FROM fhir_dashboard_stats();

-- ────────────────────────────────────────────────────────────
-- 15. Stored procedure: full-text search
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 15. Full-text search for "Sertraline" ═══'
SELECT * FROM fhir_fulltext_search('Sertraline');

-- ────────────────────────────────────────────────────────────
-- 16. Stored procedure: patient timeline
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 16. Timeline for pat-001 (first 15 events) ═══'
SELECT * FROM fhir_patient_timeline('pat-001') LIMIT 15;

-- ────────────────────────────────────────────────────────────
-- 17. Ad-hoc: JSONB queries (proving the raw resource works)
-- ────────────────────────────────────────────────────────────
\echo ''
\echo '═══ 17. JSONB query: patients with hypertension ═══'
SELECT id, code_display, patient_display, clinical_status, onset_date
FROM FHIR_Condition
WHERE resource_json @> '{"code":{"coding":[{"code":"I10"}]}}'
   OR code_display ILIKE '%hypertension%';

\echo ''
\echo '═══ 18. JSONB query: total claims by patient ═══'
SELECT patient_display, COUNT(*) AS claim_count,
       SUM(total_value) AS total_amount
FROM FHIR_Claim
GROUP BY patient_id, patient_display
ORDER BY total_amount DESC;

\echo ''
\echo '═══ 19. Practitioners and their patient counts ═══'
SELECT pr.full_name, pr.specialty,
       COUNT(DISTINCT p.id) AS patient_count
FROM FHIR_Practitioner pr
LEFT JOIN FHIR_Patient p ON p.general_practitioner_id = pr.id
GROUP BY pr.id, pr.full_name, pr.specialty
ORDER BY patient_count DESC;

\echo ''
\echo '═══ 20. Observations per vital type ═══'
SELECT code_display AS vital_type,
       COUNT(*) AS readings,
       ROUND(AVG(value_quantity), 1) AS avg_value,
       MIN(value_quantity) AS min_value,
       MAX(value_quantity) AS max_value,
       value_unit AS unit
FROM FHIR_Observation
WHERE category_code = 'vital-signs'
  AND value_quantity IS NOT NULL
GROUP BY code_display, value_unit
ORDER BY readings DESC;

-- ============================================================
\echo ''
\echo '✅ Validation complete'
-- ============================================================
