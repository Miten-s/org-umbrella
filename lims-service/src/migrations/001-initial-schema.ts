import { QueryInterface } from "sequelize";

/** The complete LIMS schema. Generated from the final state of the earlier migration
 * history, which was squashed into this one before the first production deploy. Add later
 * changes as new migrations; never edit this one. Runs as one statement batch, so it
 * applies completely or not at all. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(SCHEMA);
};

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TABLE public.lims_access_bypass_logs (
    id uuid NOT NULL,
    performed_by character varying(100) NOT NULL,
    performed_by_name character varying(200),
    entity character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    method character varying(10) NOT NULL,
    path text NOT NULL,
    request_id character varying(100),
    performed_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_aliquot_sets (
    id uuid NOT NULL,
    aliquot_set_id character varying(100) NOT NULL,
    stock_batch_id uuid NOT NULL,
    aliquots_number integer,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_aliquots (
    id uuid NOT NULL,
    aliquot_set_id uuid NOT NULL,
    aliquot_id character varying(100),
    description text,
    quantity numeric(18,6),
    unit character varying(50),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_analyses (
    id uuid NOT NULL,
    analysis_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    analysis_type_id uuid,
    approval_status_id uuid,
    inspection_plan_id uuid,
    sop_reference character varying(200),
    description text,
    details text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_analysis_components (
    id uuid NOT NULL,
    analysis_id uuid NOT NULL,
    component_id character varying(100),
    name character varying(200),
    description text,
    type character varying(50),
    unit character varying(50),
    calculation text,
    formula text,
    option character varying(255),
    list text,
    entity character varying(150),
    entity_criteria text,
    min character varying(100),
    max character varying(100),
    sort_order integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_attachments (
    id uuid NOT NULL,
    entity_name character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    mime_type character varying(150),
    size_bytes bigint DEFAULT 0 NOT NULL,
    comment text,
    uploaded_by character varying(100),
    uploaded_by_name character varying(200),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_audit_logs (
    id uuid NOT NULL,
    entity_name character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    change_reason text,
    performed_by character varying(100) NOT NULL,
    performed_by_name character varying(200),
    performed_at timestamp with time zone NOT NULL,
    child_changes jsonb,
    CONSTRAINT lims_audit_logs_action_check CHECK (((action)::text = ANY ((ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'RESTORE'::character varying, 'CANCEL'::character varying, 'REACTIVATE'::character varying])::text[])))
);

CREATE TABLE public.lims_batches (
    id uuid NOT NULL,
    batch_id character varying(100) NOT NULL,
    batch_name character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Open'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(100),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_calibrations (
    id uuid NOT NULL,
    calibration_id character varying(100) NOT NULL,
    calibration_name character varying(200) NOT NULL,
    instrument_id uuid NOT NULL,
    calibration_type_id uuid,
    status_id uuid,
    plan character varying(50),
    plan_time character varying(20),
    lead_time_value integer,
    lead_time_unit character varying(20),
    owner_id uuid,
    contractor character varying(200),
    last_maintenance_date date,
    next_maintenance_date date,
    auto_login boolean DEFAULT false NOT NULL,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_customers (
    id uuid NOT NULL,
    customer_id character varying(100) NOT NULL,
    customer_name character varying(200) NOT NULL,
    description text,
    rating_id uuid,
    website character varying(255),
    contact_name character varying(200),
    contact_phone character varying(50),
    email character varying(200),
    address jsonb,
    other_information text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_groups (
    id uuid NOT NULL,
    group_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    owned_by character varying(100),
    parent_group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    owned_by_name character varying(200)
);

CREATE TABLE public.lims_id_sequences (
    entity character varying(50) NOT NULL,
    prefix character varying(10) NOT NULL,
    last_value bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_inspection_personnel (
    id uuid NOT NULL,
    inspection_plan_id uuid NOT NULL,
    inspection_type character varying(50),
    person_id uuid,
    role_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_inspection_plans (
    id uuid NOT NULL,
    inspection_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    inspection_type character varying(50),
    details text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_instrument_parameter_values (
    id uuid NOT NULL,
    instrument_id uuid NOT NULL,
    identity character varying(200),
    value character varying(255),
    unit character varying(50),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_instrument_parts (
    id uuid NOT NULL,
    part_id character varying(100) NOT NULL,
    part_name character varying(200) NOT NULL,
    description text,
    instrument_id uuid NOT NULL,
    status_id uuid,
    location_id uuid,
    supplier_id uuid,
    date_installed date,
    sop_reference character varying(200),
    manufacturer character varying(200),
    serial_number character varying(150),
    model_number character varying(150),
    measuring_information text,
    details text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_instruments (
    id uuid NOT NULL,
    instrument_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    type_id uuid,
    measurement_type_id uuid,
    status_id uuid,
    location_id uuid,
    supplier_id uuid,
    date_installed date,
    last_msa_date date,
    sop_reference character varying(200),
    manufacturer character varying(200),
    serial_number character varying(150),
    model_number character varying(150),
    measuring_information text,
    msa_information text,
    details text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_locations (
    id uuid NOT NULL,
    location_id character varying(100) NOT NULL,
    location_name character varying(200) NOT NULL,
    description text,
    other_information text,
    status character varying(20) DEFAULT 'enabled'::character varying NOT NULL,
    location_type_id uuid,
    parent_location_id uuid,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_lots (
    id uuid NOT NULL,
    lot_id character varying(100) NOT NULL,
    lot_name character varying(200) NOT NULL,
    description text,
    batch_id uuid,
    status character varying(20) DEFAULT 'Open'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(100),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_maintenance_records (
    id uuid NOT NULL,
    instrument_id uuid,
    instrument_part_id uuid,
    maintenance_name character varying(200),
    performed_on timestamp with time zone,
    performed_by character varying(200),
    remarks text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT lims_maintenance_one_owner CHECK ((num_nonnulls(instrument_id, instrument_part_id) = 1))
);

CREATE TABLE public.lims_parameters (
    id uuid NOT NULL,
    parameter_id character varying(100) NOT NULL,
    parameter_name character varying(200) NOT NULL,
    parameter_type_id uuid,
    default_value character varying(255),
    unit character varying(50),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_phrase_entries (
    id uuid NOT NULL,
    phrase_id uuid NOT NULL,
    phrase_entry_id character varying(100) NOT NULL,
    name character varying(200),
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_phrases (
    id uuid NOT NULL,
    phrase character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    group_id uuid,
    is_system boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_projects (
    id uuid NOT NULL,
    project_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(100),
    details text,
    customer_id uuid,
    customer_contact character varying(200),
    supervisor_id uuid,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_results (
    id uuid NOT NULL,
    result_id character varying(100) NOT NULL,
    test_id uuid NOT NULL,
    component_id character varying(100),
    component_name character varying(200),
    value text,
    unit character varying(50),
    out_of_range boolean DEFAULT false NOT NULL,
    instrument_id uuid,
    stock_id uuid,
    entered_on timestamp with time zone,
    entered_by character varying(200),
    version integer DEFAULT 1 NOT NULL,
    is_latest boolean DEFAULT true NOT NULL,
    supersedes_id uuid,
    status character varying(20) DEFAULT 'Open'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(100),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_role_groups (
    role_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lims_sample_template_tests (
    id uuid NOT NULL,
    sample_template_id uuid NOT NULL,
    analysis_id uuid NOT NULL,
    sort_order integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_sample_templates (
    id uuid NOT NULL,
    sample_template_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    sample_type_id uuid,
    project_id uuid,
    specification_id uuid,
    location_id uuid,
    group_id uuid,
    lot_number character varying(150),
    serial_number character varying(150),
    login_date timestamp with time zone,
    login_by character varying(200),
    sample_start_date timestamp with time zone,
    sample_start_by character varying(200),
    description text,
    comments text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_samples (
    id uuid NOT NULL,
    sample_id character varying(100) NOT NULL,
    id_numeric bigint,
    id_text character varying(255),
    sample_name character varying(200),
    lot_id uuid,
    project_id uuid,
    sample_type_id uuid,
    specification_id uuid,
    test_group_id uuid,
    location_id uuid,
    stock_batch_id uuid,
    lot_number character varying(150),
    serial_number character varying(150),
    login_date timestamp with time zone,
    login_by character varying(200),
    sample_start_date timestamp with time zone,
    sample_start_by character varying(200),
    description text,
    comments text,
    status character varying(20) DEFAULT 'Open'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(100),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_schedulers (
    id uuid NOT NULL,
    scheduler_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    scope character varying(50),
    project_id uuid,
    analysis_id uuid,
    test_group_id uuid,
    specification_id uuid,
    sample_type_id uuid,
    owner_id uuid,
    plan character varying(50),
    plan_time character varying(20),
    lead_time_value integer,
    lead_time_unit character varying(20),
    last_run_date timestamp with time zone,
    next_run_date timestamp with time zone,
    generated_count integer DEFAULT 0 NOT NULL,
    description text,
    auto_login boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_spec_limits (
    id uuid NOT NULL,
    specification_id uuid NOT NULL,
    analysis_name character varying(200),
    component_name character varying(200),
    min character varying(100),
    max character varying(100),
    text character varying(255),
    phrase character varying(255),
    "boolean" character varying(20),
    calculation text,
    sort_order integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    analysis_id uuid,
    component_id uuid
);

CREATE TABLE public.lims_specifications (
    id uuid NOT NULL,
    spec_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stock_batch_consumptions (
    id uuid NOT NULL,
    stock_batch_id uuid NOT NULL,
    consumed_on timestamp with time zone,
    consumed_by character varying(200),
    amount numeric(18,6),
    unit character varying(50),
    remarks text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stock_batch_parameter_values (
    id uuid NOT NULL,
    stock_batch_id uuid NOT NULL,
    identity character varying(200),
    value character varying(255),
    unit character varying(50),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stock_batches (
    id uuid NOT NULL,
    stock_batch_id character varying(150) NOT NULL,
    batch_number integer NOT NULL,
    stock_id uuid NOT NULL,
    status_id uuid,
    project_id uuid,
    supplier_id uuid,
    location_id uuid,
    manufacturing_date date,
    expiry_date date,
    supplier_batch_number character varying(150),
    sap_batch_id character varying(150),
    internal_batch_id character varying(150),
    initial_amount numeric(18,6),
    current_amount numeric(18,6),
    unit character varying(50),
    description text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stock_parameter_values (
    id uuid NOT NULL,
    stock_id uuid NOT NULL,
    identity character varying(200),
    value character varying(255),
    unit character varying(50),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stock_suppliers (
    id uuid NOT NULL,
    stock_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_stocks (
    id uuid NOT NULL,
    stock_id character varying(100) NOT NULL,
    stock_name character varying(200) NOT NULL,
    stock_type_id uuid,
    operator_id uuid,
    default_location_id uuid,
    preferred_supplier_id uuid,
    unit character varying(50),
    target_amount numeric(18,6),
    low_amount numeric(18,6),
    low_percentage numeric(5,2),
    description text,
    details text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_studies (
    id uuid NOT NULL,
    study_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    study_code character varying(100),
    details text,
    project_id uuid,
    project_details text,
    supervisor_id uuid,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_suppliers (
    id uuid NOT NULL,
    supplier_id character varying(100) NOT NULL,
    supplier_name character varying(200) NOT NULL,
    description text,
    rating_id uuid,
    website character varying(255),
    contact_name character varying(200),
    contact_phone character varying(50),
    email character varying(200),
    address jsonb,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_test_group_items (
    id uuid NOT NULL,
    test_group_id uuid NOT NULL,
    sort_order integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    analysis_id uuid NOT NULL
);

CREATE TABLE public.lims_test_groups (
    id uuid NOT NULL,
    test_group_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_test_windows (
    id uuid NOT NULL,
    sample_id uuid NOT NULL,
    test_id uuid,
    analysis_name character varying(200),
    component_id character varying(100),
    component_name character varying(200),
    description text,
    value text,
    unit character varying(50),
    out_of_range boolean DEFAULT false NOT NULL,
    entered_on timestamp with time zone,
    entered_by character varying(200),
    instrument_id uuid,
    stock_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_tests (
    id uuid NOT NULL,
    test_id character varying(100) NOT NULL,
    test_name character varying(200),
    sample_id uuid NOT NULL,
    analysis_id uuid,
    instrument_id uuid,
    replicate_count integer,
    login_date timestamp with time zone,
    login_by character varying(200),
    description text,
    status character varying(20) DEFAULT 'Open'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(100),
    group_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_user_access_groups (
    id uuid NOT NULL,
    lims_user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_user_roles (
    id uuid NOT NULL,
    lims_user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.lims_users (
    id uuid NOT NULL,
    user_id character varying(100) NOT NULL,
    user_name character varying(200),
    group_id uuid,
    location_id uuid,
    signature text,
    description text,
    training_completed boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(100),
    modified_by character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE ONLY public.lims_access_bypass_logs
    ADD CONSTRAINT lims_access_bypass_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_aliquot_sets
    ADD CONSTRAINT lims_aliquot_sets_aliquot_set_id_key UNIQUE (aliquot_set_id);

ALTER TABLE ONLY public.lims_aliquot_sets
    ADD CONSTRAINT lims_aliquot_sets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_aliquots
    ADD CONSTRAINT lims_aliquots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_analysis_id_key UNIQUE (analysis_id);

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_analysis_components
    ADD CONSTRAINT lims_analysis_components_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_attachments
    ADD CONSTRAINT lims_attachments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_audit_logs
    ADD CONSTRAINT lims_audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_batches
    ADD CONSTRAINT lims_batches_batch_id_key UNIQUE (batch_id);

ALTER TABLE ONLY public.lims_batches
    ADD CONSTRAINT lims_batches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_calibration_id_key UNIQUE (calibration_id);

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_customers
    ADD CONSTRAINT lims_customers_customer_id_key UNIQUE (customer_id);

ALTER TABLE ONLY public.lims_customers
    ADD CONSTRAINT lims_customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_groups
    ADD CONSTRAINT lims_groups_group_id_key UNIQUE (group_id);

ALTER TABLE ONLY public.lims_groups
    ADD CONSTRAINT lims_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_id_sequences
    ADD CONSTRAINT lims_id_sequences_pkey PRIMARY KEY (entity);

ALTER TABLE ONLY public.lims_inspection_personnel
    ADD CONSTRAINT lims_inspection_personnel_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_inspection_plans
    ADD CONSTRAINT lims_inspection_plans_inspection_id_key UNIQUE (inspection_id);

ALTER TABLE ONLY public.lims_inspection_plans
    ADD CONSTRAINT lims_inspection_plans_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_instrument_parameter_values
    ADD CONSTRAINT lims_instrument_parameter_values_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_part_id_key UNIQUE (part_id);

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_instrument_id_key UNIQUE (instrument_id);

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_locations
    ADD CONSTRAINT lims_locations_location_id_key UNIQUE (location_id);

ALTER TABLE ONLY public.lims_locations
    ADD CONSTRAINT lims_locations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_lots
    ADD CONSTRAINT lims_lots_lot_id_key UNIQUE (lot_id);

ALTER TABLE ONLY public.lims_lots
    ADD CONSTRAINT lims_lots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_maintenance_records
    ADD CONSTRAINT lims_maintenance_records_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_parameters
    ADD CONSTRAINT lims_parameters_parameter_id_key UNIQUE (parameter_id);

ALTER TABLE ONLY public.lims_parameters
    ADD CONSTRAINT lims_parameters_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_phrase_entries
    ADD CONSTRAINT lims_phrase_entries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_phrases
    ADD CONSTRAINT lims_phrases_phrase_key UNIQUE (phrase);

ALTER TABLE ONLY public.lims_phrases
    ADD CONSTRAINT lims_phrases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_projects
    ADD CONSTRAINT lims_projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_projects
    ADD CONSTRAINT lims_projects_project_id_key UNIQUE (project_id);

ALTER TABLE ONLY public.lims_results
    ADD CONSTRAINT lims_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_role_groups
    ADD CONSTRAINT lims_role_groups_pkey PRIMARY KEY (role_id);

ALTER TABLE ONLY public.lims_sample_template_tests
    ADD CONSTRAINT lims_sample_template_tests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_sample_template_id_key UNIQUE (sample_template_id);

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_sample_id_key UNIQUE (sample_id);

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_scheduler_id_key UNIQUE (scheduler_id);

ALTER TABLE ONLY public.lims_spec_limits
    ADD CONSTRAINT lims_spec_limits_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_specifications
    ADD CONSTRAINT lims_specifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_specifications
    ADD CONSTRAINT lims_specifications_spec_id_key UNIQUE (spec_id);

ALTER TABLE ONLY public.lims_stock_batch_consumptions
    ADD CONSTRAINT lims_stock_batch_consumptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stock_batch_parameter_values
    ADD CONSTRAINT lims_stock_batch_parameter_values_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_stock_batch_id_key UNIQUE (stock_batch_id);

ALTER TABLE ONLY public.lims_stock_parameter_values
    ADD CONSTRAINT lims_stock_parameter_values_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stock_suppliers
    ADD CONSTRAINT lims_stock_suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_stock_id_key UNIQUE (stock_id);

ALTER TABLE ONLY public.lims_studies
    ADD CONSTRAINT lims_studies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_studies
    ADD CONSTRAINT lims_studies_study_id_key UNIQUE (study_id);

ALTER TABLE ONLY public.lims_suppliers
    ADD CONSTRAINT lims_suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_suppliers
    ADD CONSTRAINT lims_suppliers_supplier_id_key UNIQUE (supplier_id);

ALTER TABLE ONLY public.lims_test_group_items
    ADD CONSTRAINT lims_test_group_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_test_groups
    ADD CONSTRAINT lims_test_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_test_groups
    ADD CONSTRAINT lims_test_groups_test_group_id_key UNIQUE (test_group_id);

ALTER TABLE ONLY public.lims_test_windows
    ADD CONSTRAINT lims_test_windows_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_test_id_key UNIQUE (test_id);

ALTER TABLE ONLY public.lims_user_access_groups
    ADD CONSTRAINT lims_user_access_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_user_roles
    ADD CONSTRAINT lims_user_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_users
    ADD CONSTRAINT lims_users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lims_users
    ADD CONSTRAINT lims_users_user_id_key UNIQUE (user_id);

CREATE INDEX lims_access_bypass_logs_performed_at ON public.lims_access_bypass_logs USING btree (performed_at);

CREATE INDEX lims_access_bypass_logs_performed_by ON public.lims_access_bypass_logs USING btree (performed_by);

CREATE INDEX lims_aliquot_sets_active_sort_idx ON public.lims_aliquot_sets USING btree (is_deleted, aliquot_set_id);

CREATE INDEX lims_aliquot_sets_aliquot_set_id_trgm_idx ON public.lims_aliquot_sets USING gin (aliquot_set_id public.gin_trgm_ops);

CREATE INDEX lims_aliquot_sets_group_id ON public.lims_aliquot_sets USING btree (group_id);

CREATE INDEX lims_aliquot_sets_stock_batch_id ON public.lims_aliquot_sets USING btree (stock_batch_id);

CREATE INDEX lims_aliquots_aliquot_set_id ON public.lims_aliquots USING btree (aliquot_set_id);

CREATE INDEX lims_analyses_active_sort_idx ON public.lims_analyses USING btree (is_deleted, name);

CREATE INDEX lims_analyses_analysis_id_trgm_idx ON public.lims_analyses USING gin (analysis_id public.gin_trgm_ops);

CREATE INDEX lims_analyses_description_trgm_idx ON public.lims_analyses USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_analyses_group_id ON public.lims_analyses USING btree (group_id);

CREATE INDEX lims_analyses_name_trgm_idx ON public.lims_analyses USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_analyses_sop_reference_trgm_idx ON public.lims_analyses USING gin (sop_reference public.gin_trgm_ops);

CREATE INDEX lims_analysis_components_analysis_id ON public.lims_analysis_components USING btree (analysis_id);

CREATE INDEX lims_attachments_group_id ON public.lims_attachments USING btree (group_id);

CREATE INDEX lims_attachments_owner_idx ON public.lims_attachments USING btree (entity_name, entity_id);

CREATE INDEX lims_audit_logs_entity_name_entity_id ON public.lims_audit_logs USING btree (entity_name, entity_id);

CREATE INDEX lims_batches_active_sort_idx ON public.lims_batches USING btree (is_deleted, created_at);

CREATE INDEX lims_batches_batch_id_trgm_idx ON public.lims_batches USING gin (batch_id public.gin_trgm_ops);

CREATE INDEX lims_batches_batch_name_trgm_idx ON public.lims_batches USING gin (batch_name public.gin_trgm_ops);

CREATE INDEX lims_batches_description_trgm_idx ON public.lims_batches USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_batches_group_id ON public.lims_batches USING btree (group_id);

CREATE INDEX lims_batches_status ON public.lims_batches USING btree (status);

CREATE INDEX lims_calibrations_active_sort_idx ON public.lims_calibrations USING btree (is_deleted, calibration_name);

CREATE INDEX lims_calibrations_calibration_id_trgm_idx ON public.lims_calibrations USING gin (calibration_id public.gin_trgm_ops);

CREATE INDEX lims_calibrations_calibration_name_trgm_idx ON public.lims_calibrations USING gin (calibration_name public.gin_trgm_ops);

CREATE INDEX lims_calibrations_contractor_trgm_idx ON public.lims_calibrations USING gin (contractor public.gin_trgm_ops);

CREATE INDEX lims_calibrations_group_id ON public.lims_calibrations USING btree (group_id);

CREATE INDEX lims_calibrations_instrument_id ON public.lims_calibrations USING btree (instrument_id);

CREATE INDEX lims_calibrations_next_maintenance_date ON public.lims_calibrations USING btree (next_maintenance_date);

CREATE INDEX lims_customers_active_sort_idx ON public.lims_customers USING btree (is_deleted, customer_name);

CREATE INDEX lims_customers_contact_name_trgm_idx ON public.lims_customers USING gin (contact_name public.gin_trgm_ops);

CREATE INDEX lims_customers_customer_id_trgm_idx ON public.lims_customers USING gin (customer_id public.gin_trgm_ops);

CREATE INDEX lims_customers_customer_name_trgm_idx ON public.lims_customers USING gin (customer_name public.gin_trgm_ops);

CREATE INDEX lims_customers_email_trgm_idx ON public.lims_customers USING gin (email public.gin_trgm_ops);

CREATE INDEX lims_customers_group_id ON public.lims_customers USING btree (group_id);

CREATE INDEX lims_groups_active_sort_idx ON public.lims_groups USING btree (is_deleted, name);

CREATE INDEX lims_groups_description_trgm_idx ON public.lims_groups USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_groups_group_id_trgm_idx ON public.lims_groups USING gin (group_id public.gin_trgm_ops);

CREATE INDEX lims_groups_name_trgm_idx ON public.lims_groups USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_groups_parent_group_id ON public.lims_groups USING btree (parent_group_id);

CREATE INDEX lims_inspection_personnel_inspection_plan_id ON public.lims_inspection_personnel USING btree (inspection_plan_id);

CREATE INDEX lims_inspection_plans_active_sort_idx ON public.lims_inspection_plans USING btree (is_deleted, name);

CREATE INDEX lims_inspection_plans_description_trgm_idx ON public.lims_inspection_plans USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_inspection_plans_group_id ON public.lims_inspection_plans USING btree (group_id);

CREATE INDEX lims_inspection_plans_inspection_id_trgm_idx ON public.lims_inspection_plans USING gin (inspection_id public.gin_trgm_ops);

CREATE INDEX lims_inspection_plans_name_trgm_idx ON public.lims_inspection_plans USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_instrument_parameter_values_instrument_id ON public.lims_instrument_parameter_values USING btree (instrument_id);

CREATE INDEX lims_instrument_parts_active_sort_idx ON public.lims_instrument_parts USING btree (is_deleted, part_name);

CREATE INDEX lims_instrument_parts_group_id ON public.lims_instrument_parts USING btree (group_id);

CREATE INDEX lims_instrument_parts_instrument_id ON public.lims_instrument_parts USING btree (instrument_id);

CREATE INDEX lims_instrument_parts_manufacturer_trgm_idx ON public.lims_instrument_parts USING gin (manufacturer public.gin_trgm_ops);

CREATE INDEX lims_instrument_parts_model_number_trgm_idx ON public.lims_instrument_parts USING gin (model_number public.gin_trgm_ops);

CREATE INDEX lims_instrument_parts_part_id_trgm_idx ON public.lims_instrument_parts USING gin (part_id public.gin_trgm_ops);

CREATE INDEX lims_instrument_parts_part_name_trgm_idx ON public.lims_instrument_parts USING gin (part_name public.gin_trgm_ops);

CREATE INDEX lims_instrument_parts_serial_number_trgm_idx ON public.lims_instrument_parts USING gin (serial_number public.gin_trgm_ops);

CREATE INDEX lims_instruments_active_sort_idx ON public.lims_instruments USING btree (is_deleted, name);

CREATE INDEX lims_instruments_group_id ON public.lims_instruments USING btree (group_id);

CREATE INDEX lims_instruments_instrument_id_trgm_idx ON public.lims_instruments USING gin (instrument_id public.gin_trgm_ops);

CREATE INDEX lims_instruments_manufacturer_trgm_idx ON public.lims_instruments USING gin (manufacturer public.gin_trgm_ops);

CREATE INDEX lims_instruments_model_number_trgm_idx ON public.lims_instruments USING gin (model_number public.gin_trgm_ops);

CREATE INDEX lims_instruments_name_trgm_idx ON public.lims_instruments USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_instruments_serial_number_trgm_idx ON public.lims_instruments USING gin (serial_number public.gin_trgm_ops);

CREATE INDEX lims_locations_active_sort_idx ON public.lims_locations USING btree (is_deleted, location_name);

CREATE INDEX lims_locations_description_trgm_idx ON public.lims_locations USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_locations_group_id ON public.lims_locations USING btree (group_id);

CREATE INDEX lims_locations_location_id_trgm_idx ON public.lims_locations USING gin (location_id public.gin_trgm_ops);

CREATE INDEX lims_locations_location_name_trgm_idx ON public.lims_locations USING gin (location_name public.gin_trgm_ops);

CREATE INDEX lims_locations_parent_location_id ON public.lims_locations USING btree (parent_location_id);

CREATE INDEX lims_lots_active_sort_idx ON public.lims_lots USING btree (is_deleted, created_at);

CREATE INDEX lims_lots_batch_id ON public.lims_lots USING btree (batch_id);

CREATE INDEX lims_lots_description_trgm_idx ON public.lims_lots USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_lots_group_id ON public.lims_lots USING btree (group_id);

CREATE INDEX lims_lots_lot_id_trgm_idx ON public.lims_lots USING gin (lot_id public.gin_trgm_ops);

CREATE INDEX lims_lots_lot_name_trgm_idx ON public.lims_lots USING gin (lot_name public.gin_trgm_ops);

CREATE INDEX lims_maintenance_records_instrument_id ON public.lims_maintenance_records USING btree (instrument_id);

CREATE INDEX lims_maintenance_records_instrument_part_id ON public.lims_maintenance_records USING btree (instrument_part_id);

CREATE INDEX lims_parameters_active_sort_idx ON public.lims_parameters USING btree (is_deleted, parameter_name);

CREATE INDEX lims_parameters_group_id ON public.lims_parameters USING btree (group_id);

CREATE INDEX lims_parameters_parameter_id_trgm_idx ON public.lims_parameters USING gin (parameter_id public.gin_trgm_ops);

CREATE INDEX lims_parameters_parameter_name_trgm_idx ON public.lims_parameters USING gin (parameter_name public.gin_trgm_ops);

CREATE INDEX lims_parameters_unit_trgm_idx ON public.lims_parameters USING gin (unit public.gin_trgm_ops);

CREATE UNIQUE INDEX lims_phrase_entries_phrase_id_phrase_entry_id ON public.lims_phrase_entries USING btree (phrase_id, phrase_entry_id);

CREATE INDEX lims_phrases_active_sort_idx ON public.lims_phrases USING btree (is_deleted, name);

CREATE INDEX lims_phrases_description_trgm_idx ON public.lims_phrases USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_phrases_name_trgm_idx ON public.lims_phrases USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_phrases_phrase_trgm_idx ON public.lims_phrases USING gin (phrase public.gin_trgm_ops);

CREATE INDEX lims_projects_active_sort_idx ON public.lims_projects USING btree (is_deleted, name);

CREATE INDEX lims_projects_code_trgm_idx ON public.lims_projects USING gin (code public.gin_trgm_ops);

CREATE INDEX lims_projects_customer_id ON public.lims_projects USING btree (customer_id);

CREATE INDEX lims_projects_details_trgm_idx ON public.lims_projects USING gin (details public.gin_trgm_ops);

CREATE INDEX lims_projects_group_id ON public.lims_projects USING btree (group_id);

CREATE INDEX lims_projects_name_trgm_idx ON public.lims_projects USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_projects_project_id_trgm_idx ON public.lims_projects USING gin (project_id public.gin_trgm_ops);

CREATE INDEX lims_results_active_sort_idx ON public.lims_results USING btree (is_deleted, created_at);

CREATE INDEX lims_results_component_name_trgm_idx ON public.lims_results USING gin (component_name public.gin_trgm_ops);

CREATE INDEX lims_results_group_id ON public.lims_results USING btree (group_id);

CREATE INDEX lims_results_live_created_idx ON public.lims_results USING btree (created_at DESC, id) WHERE ((is_deleted = false) AND (is_latest = true));

CREATE UNIQUE INDEX lims_results_one_current_per_component_idx ON public.lims_results USING btree (test_id, component_id) WHERE ((is_latest = true) AND (is_deleted = false));

CREATE INDEX lims_results_result_id_trgm_idx ON public.lims_results USING gin (result_id public.gin_trgm_ops);

CREATE INDEX lims_results_test_id ON public.lims_results USING btree (test_id);

CREATE INDEX lims_results_value_trgm_idx ON public.lims_results USING gin (value public.gin_trgm_ops);

CREATE INDEX lims_results_version_chain_idx ON public.lims_results USING btree (test_id, component_id, version);

CREATE UNIQUE INDEX lims_sample_template_tests_sample_template_id_analysis_id ON public.lims_sample_template_tests USING btree (sample_template_id, analysis_id);

CREATE INDEX lims_sample_templates_group_id ON public.lims_sample_templates USING btree (group_id);

CREATE INDEX lims_sample_templates_is_deleted_name ON public.lims_sample_templates USING btree (is_deleted, name);

CREATE INDEX lims_samples_active_sort_idx ON public.lims_samples USING btree (is_deleted, created_at);

CREATE INDEX lims_samples_group_id ON public.lims_samples USING btree (group_id);

CREATE INDEX lims_samples_id_text_trgm_idx ON public.lims_samples USING gin (id_text public.gin_trgm_ops);

CREATE INDEX lims_samples_live_created_idx ON public.lims_samples USING btree (created_at DESC) WHERE (is_deleted = false);

CREATE INDEX lims_samples_lot_id ON public.lims_samples USING btree (lot_id);

CREATE INDEX lims_samples_lot_number_trgm_idx ON public.lims_samples USING gin (lot_number public.gin_trgm_ops);

CREATE INDEX lims_samples_project_id ON public.lims_samples USING btree (project_id);

CREATE INDEX lims_samples_sample_id_trgm_idx ON public.lims_samples USING gin (sample_id public.gin_trgm_ops);

CREATE INDEX lims_samples_sample_name_trgm_idx ON public.lims_samples USING gin (sample_name public.gin_trgm_ops);

CREATE INDEX lims_samples_serial_number_trgm_idx ON public.lims_samples USING gin (serial_number public.gin_trgm_ops);

CREATE INDEX lims_samples_status ON public.lims_samples USING btree (status);

CREATE INDEX lims_schedulers_active_sort_idx ON public.lims_schedulers USING btree (is_deleted, name);

CREATE INDEX lims_schedulers_description_trgm_idx ON public.lims_schedulers USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_schedulers_due_idx ON public.lims_schedulers USING btree (next_run_date) WHERE ((is_active = true) AND (is_deleted = false));

CREATE INDEX lims_schedulers_group_id ON public.lims_schedulers USING btree (group_id);

CREATE INDEX lims_schedulers_name_trgm_idx ON public.lims_schedulers USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_schedulers_scheduler_id_trgm_idx ON public.lims_schedulers USING gin (scheduler_id public.gin_trgm_ops);

CREATE INDEX lims_spec_limits_specification_id ON public.lims_spec_limits USING btree (specification_id);

CREATE INDEX lims_specifications_active_sort_idx ON public.lims_specifications USING btree (is_deleted, name);

CREATE INDEX lims_specifications_description_trgm_idx ON public.lims_specifications USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_specifications_group_id ON public.lims_specifications USING btree (group_id);

CREATE INDEX lims_specifications_name_trgm_idx ON public.lims_specifications USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_specifications_spec_id_trgm_idx ON public.lims_specifications USING gin (spec_id public.gin_trgm_ops);

CREATE INDEX lims_stock_batch_consumptions_stock_batch_id ON public.lims_stock_batch_consumptions USING btree (stock_batch_id);

CREATE INDEX lims_stock_batch_parameter_values_stock_batch_id ON public.lims_stock_batch_parameter_values USING btree (stock_batch_id);

CREATE INDEX lims_stock_batches_active_sort_idx ON public.lims_stock_batches USING btree (is_deleted, stock_batch_id);

CREATE INDEX lims_stock_batches_group_id ON public.lims_stock_batches USING btree (group_id);

CREATE INDEX lims_stock_batches_internal_batch_id_trgm_idx ON public.lims_stock_batches USING gin (internal_batch_id public.gin_trgm_ops);

CREATE UNIQUE INDEX lims_stock_batches_number_per_stock_idx ON public.lims_stock_batches USING btree (stock_id, batch_number);

CREATE INDEX lims_stock_batches_sap_batch_id_trgm_idx ON public.lims_stock_batches USING gin (sap_batch_id public.gin_trgm_ops);

CREATE INDEX lims_stock_batches_stock_batch_id_trgm_idx ON public.lims_stock_batches USING gin (stock_batch_id public.gin_trgm_ops);

CREATE INDEX lims_stock_batches_stock_id ON public.lims_stock_batches USING btree (stock_id);

CREATE INDEX lims_stock_batches_supplier_batch_number_trgm_idx ON public.lims_stock_batches USING gin (supplier_batch_number public.gin_trgm_ops);

CREATE INDEX lims_stock_parameter_values_stock_id ON public.lims_stock_parameter_values USING btree (stock_id);

CREATE UNIQUE INDEX lims_stock_suppliers_pair_idx ON public.lims_stock_suppliers USING btree (stock_id, supplier_id);

CREATE INDEX lims_stocks_active_sort_idx ON public.lims_stocks USING btree (is_deleted, stock_name);

CREATE INDEX lims_stocks_description_trgm_idx ON public.lims_stocks USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_stocks_group_id ON public.lims_stocks USING btree (group_id);

CREATE INDEX lims_stocks_stock_id_trgm_idx ON public.lims_stocks USING gin (stock_id public.gin_trgm_ops);

CREATE INDEX lims_stocks_stock_name_trgm_idx ON public.lims_stocks USING gin (stock_name public.gin_trgm_ops);

CREATE INDEX lims_studies_active_sort_idx ON public.lims_studies USING btree (is_deleted, name);

CREATE INDEX lims_studies_details_trgm_idx ON public.lims_studies USING gin (details public.gin_trgm_ops);

CREATE INDEX lims_studies_group_id ON public.lims_studies USING btree (group_id);

CREATE INDEX lims_studies_name_trgm_idx ON public.lims_studies USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_studies_project_id ON public.lims_studies USING btree (project_id);

CREATE INDEX lims_studies_study_code_trgm_idx ON public.lims_studies USING gin (study_code public.gin_trgm_ops);

CREATE INDEX lims_studies_study_id_trgm_idx ON public.lims_studies USING gin (study_id public.gin_trgm_ops);

CREATE INDEX lims_suppliers_active_sort_idx ON public.lims_suppliers USING btree (is_deleted, supplier_name);

CREATE INDEX lims_suppliers_contact_name_trgm_idx ON public.lims_suppliers USING gin (contact_name public.gin_trgm_ops);

CREATE INDEX lims_suppliers_email_trgm_idx ON public.lims_suppliers USING gin (email public.gin_trgm_ops);

CREATE INDEX lims_suppliers_group_id ON public.lims_suppliers USING btree (group_id);

CREATE INDEX lims_suppliers_supplier_id_trgm_idx ON public.lims_suppliers USING gin (supplier_id public.gin_trgm_ops);

CREATE INDEX lims_suppliers_supplier_name_trgm_idx ON public.lims_suppliers USING gin (supplier_name public.gin_trgm_ops);

CREATE UNIQUE INDEX lims_test_group_items_group_analysis_uq ON public.lims_test_group_items USING btree (test_group_id, analysis_id);

CREATE INDEX lims_test_group_items_test_group_id ON public.lims_test_group_items USING btree (test_group_id);

CREATE INDEX lims_test_groups_active_sort_idx ON public.lims_test_groups USING btree (is_deleted, name);

CREATE INDEX lims_test_groups_description_trgm_idx ON public.lims_test_groups USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_test_groups_group_id ON public.lims_test_groups USING btree (group_id);

CREATE INDEX lims_test_groups_name_trgm_idx ON public.lims_test_groups USING gin (name public.gin_trgm_ops);

CREATE INDEX lims_test_groups_test_group_id_trgm_idx ON public.lims_test_groups USING gin (test_group_id public.gin_trgm_ops);

CREATE INDEX lims_test_windows_sample_id ON public.lims_test_windows USING btree (sample_id);

CREATE INDEX lims_test_windows_test_id ON public.lims_test_windows USING btree (test_id);

CREATE INDEX lims_tests_active_sort_idx ON public.lims_tests USING btree (is_deleted, created_at);

CREATE INDEX lims_tests_analysis_id ON public.lims_tests USING btree (analysis_id);

CREATE INDEX lims_tests_description_trgm_idx ON public.lims_tests USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_tests_group_id ON public.lims_tests USING btree (group_id);

CREATE INDEX lims_tests_live_created_idx ON public.lims_tests USING btree (created_at DESC) WHERE (is_deleted = false);

CREATE INDEX lims_tests_sample_id ON public.lims_tests USING btree (sample_id);

CREATE INDEX lims_tests_status ON public.lims_tests USING btree (status);

CREATE INDEX lims_tests_test_id_trgm_idx ON public.lims_tests USING gin (test_id public.gin_trgm_ops);

CREATE INDEX lims_tests_test_name_trgm_idx ON public.lims_tests USING gin (test_name public.gin_trgm_ops);

CREATE UNIQUE INDEX lims_user_access_groups_lims_user_id_group_id ON public.lims_user_access_groups USING btree (lims_user_id, group_id);

CREATE UNIQUE INDEX lims_user_roles_lims_user_id_role_id ON public.lims_user_roles USING btree (lims_user_id, role_id);

CREATE INDEX lims_users_active_sort_idx ON public.lims_users USING btree (is_deleted, user_name);

CREATE INDEX lims_users_description_trgm_idx ON public.lims_users USING gin (description public.gin_trgm_ops);

CREATE INDEX lims_users_group_id ON public.lims_users USING btree (group_id);

CREATE INDEX lims_users_user_id_trgm_idx ON public.lims_users USING gin (user_id public.gin_trgm_ops);

CREATE INDEX lims_users_user_name_trgm_idx ON public.lims_users USING gin (user_name public.gin_trgm_ops);

ALTER TABLE ONLY public.lims_aliquot_sets
    ADD CONSTRAINT lims_aliquot_sets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_aliquot_sets
    ADD CONSTRAINT lims_aliquot_sets_stock_batch_id_fkey FOREIGN KEY (stock_batch_id) REFERENCES public.lims_stock_batches(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_aliquots
    ADD CONSTRAINT lims_aliquots_aliquot_set_id_fkey FOREIGN KEY (aliquot_set_id) REFERENCES public.lims_aliquot_sets(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_analysis_type_id_fkey FOREIGN KEY (analysis_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_approval_status_id_fkey FOREIGN KEY (approval_status_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_analyses
    ADD CONSTRAINT lims_analyses_inspection_plan_id_fkey FOREIGN KEY (inspection_plan_id) REFERENCES public.lims_inspection_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_analysis_components
    ADD CONSTRAINT lims_analysis_components_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.lims_analyses(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_attachments
    ADD CONSTRAINT lims_attachments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_batches
    ADD CONSTRAINT lims_batches_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_calibration_type_id_fkey FOREIGN KEY (calibration_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_calibrations
    ADD CONSTRAINT lims_calibrations_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_customers
    ADD CONSTRAINT lims_customers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_customers
    ADD CONSTRAINT lims_customers_rating_id_fkey FOREIGN KEY (rating_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_groups
    ADD CONSTRAINT lims_groups_parent_group_id_fkey FOREIGN KEY (parent_group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_inspection_personnel
    ADD CONSTRAINT lims_inspection_personnel_inspection_plan_id_fkey FOREIGN KEY (inspection_plan_id) REFERENCES public.lims_inspection_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_inspection_personnel
    ADD CONSTRAINT lims_inspection_personnel_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_inspection_plans
    ADD CONSTRAINT lims_inspection_plans_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instrument_parameter_values
    ADD CONSTRAINT lims_instrument_parameter_values_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instrument_parts
    ADD CONSTRAINT lims_instrument_parts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.lims_suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_measurement_type_id_fkey FOREIGN KEY (measurement_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.lims_suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_instruments
    ADD CONSTRAINT lims_instruments_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_locations
    ADD CONSTRAINT lims_locations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_locations
    ADD CONSTRAINT lims_locations_location_type_id_fkey FOREIGN KEY (location_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_locations
    ADD CONSTRAINT lims_locations_parent_location_id_fkey FOREIGN KEY (parent_location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_lots
    ADD CONSTRAINT lims_lots_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.lims_batches(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_lots
    ADD CONSTRAINT lims_lots_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_maintenance_records
    ADD CONSTRAINT lims_maintenance_records_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_maintenance_records
    ADD CONSTRAINT lims_maintenance_records_instrument_part_id_fkey FOREIGN KEY (instrument_part_id) REFERENCES public.lims_instrument_parts(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_parameters
    ADD CONSTRAINT lims_parameters_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_parameters
    ADD CONSTRAINT lims_parameters_parameter_type_id_fkey FOREIGN KEY (parameter_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_phrase_entries
    ADD CONSTRAINT lims_phrase_entries_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.lims_phrases(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_phrases
    ADD CONSTRAINT lims_phrases_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_projects
    ADD CONSTRAINT lims_projects_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.lims_customers(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_projects
    ADD CONSTRAINT lims_projects_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_projects
    ADD CONSTRAINT lims_projects_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_results
    ADD CONSTRAINT lims_results_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_results
    ADD CONSTRAINT lims_results_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_results
    ADD CONSTRAINT lims_results_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.lims_stocks(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_results
    ADD CONSTRAINT lims_results_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.lims_tests(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_role_groups
    ADD CONSTRAINT lims_role_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_sample_template_tests
    ADD CONSTRAINT lims_sample_template_tests_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.lims_analyses(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_sample_template_tests
    ADD CONSTRAINT lims_sample_template_tests_sample_template_id_fkey FOREIGN KEY (sample_template_id) REFERENCES public.lims_sample_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.lims_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_sample_type_id_fkey FOREIGN KEY (sample_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_sample_templates
    ADD CONSTRAINT lims_sample_templates_specification_id_fkey FOREIGN KEY (specification_id) REFERENCES public.lims_specifications(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lims_lots(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.lims_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_sample_type_id_fkey FOREIGN KEY (sample_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_specification_id_fkey FOREIGN KEY (specification_id) REFERENCES public.lims_specifications(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_stock_batch_id_fkey FOREIGN KEY (stock_batch_id) REFERENCES public.lims_stock_batches(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_samples
    ADD CONSTRAINT lims_samples_test_group_id_fkey FOREIGN KEY (test_group_id) REFERENCES public.lims_test_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.lims_analyses(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.lims_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_sample_type_id_fkey FOREIGN KEY (sample_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_specification_id_fkey FOREIGN KEY (specification_id) REFERENCES public.lims_specifications(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_schedulers
    ADD CONSTRAINT lims_schedulers_test_group_id_fkey FOREIGN KEY (test_group_id) REFERENCES public.lims_test_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_spec_limits
    ADD CONSTRAINT lims_spec_limits_specification_id_fkey FOREIGN KEY (specification_id) REFERENCES public.lims_specifications(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_specifications
    ADD CONSTRAINT lims_specifications_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_batch_consumptions
    ADD CONSTRAINT lims_stock_batch_consumptions_stock_batch_id_fkey FOREIGN KEY (stock_batch_id) REFERENCES public.lims_stock_batches(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_stock_batch_parameter_values
    ADD CONSTRAINT lims_stock_batch_parameter_values_stock_batch_id_fkey FOREIGN KEY (stock_batch_id) REFERENCES public.lims_stock_batches(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.lims_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.lims_stocks(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.lims_stock_batches
    ADD CONSTRAINT lims_stock_batches_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.lims_suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stock_parameter_values
    ADD CONSTRAINT lims_stock_parameter_values_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.lims_stocks(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_stock_suppliers
    ADD CONSTRAINT lims_stock_suppliers_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.lims_stocks(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_stock_suppliers
    ADD CONSTRAINT lims_stock_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.lims_suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_default_location_id_fkey FOREIGN KEY (default_location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_preferred_supplier_id_fkey FOREIGN KEY (preferred_supplier_id) REFERENCES public.lims_suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_stocks
    ADD CONSTRAINT lims_stocks_stock_type_id_fkey FOREIGN KEY (stock_type_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_studies
    ADD CONSTRAINT lims_studies_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_studies
    ADD CONSTRAINT lims_studies_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.lims_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_studies
    ADD CONSTRAINT lims_studies_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_suppliers
    ADD CONSTRAINT lims_suppliers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_suppliers
    ADD CONSTRAINT lims_suppliers_rating_id_fkey FOREIGN KEY (rating_id) REFERENCES public.lims_phrase_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_test_group_items
    ADD CONSTRAINT lims_test_group_items_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.lims_analyses(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_test_group_items
    ADD CONSTRAINT lims_test_group_items_test_group_id_fkey FOREIGN KEY (test_group_id) REFERENCES public.lims_test_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_test_groups
    ADD CONSTRAINT lims_test_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_test_windows
    ADD CONSTRAINT lims_test_windows_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_test_windows
    ADD CONSTRAINT lims_test_windows_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.lims_samples(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_test_windows
    ADD CONSTRAINT lims_test_windows_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.lims_stocks(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_test_windows
    ADD CONSTRAINT lims_test_windows_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.lims_tests(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.lims_analyses(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.lims_instruments(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_tests
    ADD CONSTRAINT lims_tests_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.lims_samples(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_user_access_groups
    ADD CONSTRAINT lims_user_access_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_user_access_groups
    ADD CONSTRAINT lims_user_access_groups_lims_user_id_fkey FOREIGN KEY (lims_user_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_user_roles
    ADD CONSTRAINT lims_user_roles_lims_user_id_fkey FOREIGN KEY (lims_user_id) REFERENCES public.lims_users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.lims_users
    ADD CONSTRAINT lims_users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.lims_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.lims_users
    ADD CONSTRAINT lims_users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.lims_locations(id) ON UPDATE CASCADE ON DELETE SET NULL;
`;
