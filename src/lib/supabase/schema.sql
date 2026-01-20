-- Database Schema for HealthSec Patient Management

-- Patients Table: Core demographics and admission info
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) UNIQUE NOT NULL, -- Hospital MRN
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('M', 'F', 'Other')),
    bed_number VARCHAR(10),
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Flagged', 'Reviewed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vitals Table: Time-series monitoring
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uuid UUID REFERENCES patients(id) ON DELETE CASCADE,
    hr INTEGER, -- Heart Rate
    bp VARCHAR(20), -- Blood Pressure (e.g. 120/80)
    spo2 INTEGER, -- Oxygen Saturation
    temp DECIMAL(4,1), -- Body Temperature
    is_resolved BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Labs Table: Clinical test results
CREATE TABLE IF NOT EXISTS labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uuid UUID REFERENCES patients(id) ON DELETE CASCADE,
    wbc INTEGER,
    hemoglobin DECIMAL(4,1),
    creatinine DECIMAL(4,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table: Clinical reports for NLP analysis
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uuid UUID REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    doctor_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictions Table: AI model outputs
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uuid UUID REFERENCES patients(id) ON DELETE CASCADE,
    model_type VARCHAR(50) CHECK (model_type IN ('risk_tabular', 'risk_vitals', 'imaging', 'nlp', 'outcome')),
    risk_score DECIMAL(5,4), -- 0.0000 to 1.0000
    details JSONB, -- Additional model-specific data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers or Views can be added here for real-time risk aggregation
DROP VIEW IF EXISTS patient_current_risk;
CREATE OR REPLACE VIEW patient_current_risk AS
SELECT 
    p.id, 
    p.name, 
    p.patient_id as mrn,
    p.status,
    p.bed_number,
    COALESCE(MAX(CASE WHEN pr.model_type = 'risk_tabular' THEN pr.risk_score END), 0) as tabular_risk,
    COALESCE(MAX(CASE WHEN pr.model_type = 'nlp' THEN pr.risk_score END), 0) as nlp_risk,
    COALESCE(AVG(pr.risk_score), 0) as avg_risk
FROM patients p
LEFT JOIN predictions pr ON p.id = pr.patient_uuid
GROUP BY p.id, p.name, p.patient_id, p.status, p.bed_number;
