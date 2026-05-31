-- ============================================================
-- FHIR R4 PostgreSQL Cleanup
-- Drops all FHIR_ tables, stored procedures, and views
-- Run: psql -d your_db -f 000-cleanup.sql
-- ============================================================

-- ── Views ──
DROP VIEW IF EXISTS FHIR_Patient_Summary CASCADE;

-- ── Tables (reverse dependency order) ──
DROP TABLE IF EXISTS FHIR_Appointment_Participant CASCADE;
DROP TABLE IF EXISTS FHIR_Observation_Component CASCADE;
DROP TABLE IF EXISTS FHIR_DiagnosticReport CASCADE;
DROP TABLE IF EXISTS FHIR_Claim CASCADE;
DROP TABLE IF EXISTS FHIR_Appointment CASCADE;
DROP TABLE IF EXISTS FHIR_Procedure CASCADE;
DROP TABLE IF EXISTS FHIR_Immunization CASCADE;
DROP TABLE IF EXISTS FHIR_AllergyIntolerance CASCADE;
DROP TABLE IF EXISTS FHIR_MedicationRequest CASCADE;
DROP TABLE IF EXISTS FHIR_Observation CASCADE;
DROP TABLE IF EXISTS FHIR_Condition CASCADE;
DROP TABLE IF EXISTS FHIR_Encounter CASCADE;
DROP TABLE IF EXISTS FHIR_Patient CASCADE;
DROP TABLE IF EXISTS FHIR_Location CASCADE;
DROP TABLE IF EXISTS FHIR_Practitioner CASCADE;
DROP TABLE IF EXISTS FHIR_Organization CASCADE;

-- ── Stored Procedures / Functions ──
DROP FUNCTION IF EXISTS fhir_search_patients(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS fhir_patient_summary(VARCHAR);
DROP FUNCTION IF EXISTS fhir_patient_vitals(VARCHAR, TEXT);
DROP FUNCTION IF EXISTS fhir_search_appointments(DATE, DATE, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fhir_active_medications(VARCHAR);
DROP FUNCTION IF EXISTS fhir_medications_by_patient_name(TEXT, VARCHAR);
DROP FUNCTION IF EXISTS fhir_patient_conditions(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS fhir_patient_allergies(VARCHAR);
DROP FUNCTION IF EXISTS fhir_search_observations(VARCHAR, VARCHAR, DATE, DATE, INT);
DROP FUNCTION IF EXISTS fhir_dashboard_stats();
DROP FUNCTION IF EXISTS fhir_latest_vitals(VARCHAR);
DROP FUNCTION IF EXISTS fhir_fulltext_search(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS fhir_patient_timeline(VARCHAR);

-- ============================================================
-- Done — all FHIR objects removed
-- ============================================================
