import { QueryInterface } from "sequelize";
import { UNASSIGNED_GROUP_ID } from "./default-ids";

/** The complete GXP schema. Generated from the final state of the earlier migration
 * history, which was squashed into this one before the first production deploy. Add later
 * changes as new migrations; never edit this one. Runs as one statement batch, so it
 * applies completely or not at all. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(SCHEMA);
};

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TABLE public.app_attachments (
    id uuid NOT NULL,
    application_id uuid NOT NULL,
    attachment character varying(255) NOT NULL,
    active boolean NOT NULL,
    created_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.app_departments (
    id uuid NOT NULL,
    application_id uuid NOT NULL,
    department_name character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.app_groups (
    id uuid NOT NULL,
    application_id uuid NOT NULL,
    app_group character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.app_modules (
    id uuid NOT NULL,
    module_name character varying(255) NOT NULL,
    application_id uuid,
    module_id_string character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'enabled'::character varying NOT NULL,
    created_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.app_roles (
    id uuid NOT NULL,
    role character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.app_services (
    id uuid NOT NULL,
    service character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.application_app_roles (
    application_id uuid NOT NULL,
    role_id uuid NOT NULL
);

CREATE TABLE public.application_app_services (
    application_id uuid NOT NULL,
    service_id uuid NOT NULL
);

CREATE TABLE public.applications (
    id uuid NOT NULL,
    application_name character varying(255) NOT NULL,
    application_id character varying(255),
    application_type character varying(20) NOT NULL,
    application_environment_id uuid,
    "group" character varying(255) NOT NULL,
    assignment_group_id uuid,
    application_workflow_id uuid,
    application_system_owner_id uuid,
    application_process_owner_id uuid,
    supplier_id uuid,
    notes text,
    status character varying(20) DEFAULT 'enabled'::character varying NOT NULL,
    created_on timestamp with time zone,
    created_by character varying(255),
    modified_on timestamp with time zone,
    modified_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    access_group_id uuid DEFAULT '${UNASSIGNED_GROUP_ID}'::uuid NOT NULL
);

CREATE TABLE public.assignment_group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name character varying(255) NOT NULL
);

CREATE TABLE public.assignment_groups (
    id uuid NOT NULL,
    group_name character varying(255) NOT NULL,
    manager_user_id uuid NOT NULL,
    manager_name character varying(255) NOT NULL,
    description character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_on timestamp with time zone,
    created_by character varying(40),
    modified_on timestamp with time zone,
    modified_by character varying(40),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.environments (
    id uuid NOT NULL,
    environment_name character varying(20) NOT NULL,
    description character varying(50),
    status character varying(20) DEFAULT 'enabled'::character varying NOT NULL,
    created_on timestamp with time zone,
    created_by character varying(255),
    modified_on timestamp with time zone,
    modified_by character varying(40),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.gxp_groups (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(200),
    parent_group_id uuid,
    status character varying(255) DEFAULT 'enabled'::character varying NOT NULL,
    created_by character varying(255),
    modified_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.gxp_user_access_groups (
    id uuid NOT NULL,
    gxp_user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.gxp_users (
    id uuid NOT NULL,
    auth_user_id uuid NOT NULL,
    user_name character varying(255) NOT NULL,
    user_type character varying(255) NOT NULL,
    roles uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    description character varying(100),
    status character varying(255) DEFAULT 'enabled'::character varying NOT NULL,
    training_completed boolean DEFAULT false NOT NULL,
    created_by character varying(255),
    modified_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    group_id uuid DEFAULT '${UNASSIGNED_GROUP_ID}'::uuid
);

CREATE TABLE public.service_request_attachments (
    id uuid NOT NULL,
    service_request_id character varying(50) NOT NULL,
    attachment character varying(255) NOT NULL,
    active boolean NOT NULL,
    created_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.service_request_comments (
    id integer NOT NULL,
    service_request_id character varying(50) NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE SEQUENCE public.service_request_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.service_request_comments_id_seq OWNED BY public.service_request_comments.id;

CREATE TABLE public.service_request_counters (
    application_id uuid NOT NULL,
    seq integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.service_request_modules (
    service_request_id character varying(50) NOT NULL,
    module_id uuid NOT NULL
);

CREATE TABLE public.service_request_roles (
    service_request_id character varying(50) NOT NULL,
    role_id uuid NOT NULL
);

CREATE TABLE public.service_requests (
    id character varying(50) NOT NULL,
    priority character varying(50) NOT NULL,
    application_id uuid NOT NULL,
    assignment_group_id uuid,
    location character varying(255),
    environment_id uuid,
    workflow_id uuid,
    esign_check character varying(10) DEFAULT 'No'::character varying NOT NULL,
    training_done boolean DEFAULT true NOT NULL,
    description text NOT NULL,
    short_description text NOT NULL,
    closed_on timestamp with time zone,
    closed_by character varying(40),
    created_by character varying(40),
    status character varying(50) DEFAULT 'New'::character varying NOT NULL,
    request_types_id uuid,
    service_request_id character varying(100) NOT NULL,
    notes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    record_status character varying(20) DEFAULT 'enabled'::character varying NOT NULL,
    access_group_id uuid DEFAULT '${UNASSIGNED_GROUP_ID}'::uuid NOT NULL
);

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    supplier_name character varying(20) NOT NULL,
    type_of_supplier character varying(255),
    product character varying(255),
    description character varying(50),
    status character varying(255) DEFAULT 'enabled'::character varying NOT NULL,
    created_on timestamp with time zone,
    created_by character varying(255),
    modified_on timestamp with time zone,
    modified_by character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.workflows (
    id uuid NOT NULL,
    workflow_name character varying(20) NOT NULL,
    number_of_levels integer NOT NULL,
    levels character varying(255)[] NOT NULL,
    description character varying(50),
    created_on timestamp with time zone,
    created_by character varying(255) NOT NULL,
    modified_on timestamp with time zone,
    modified_by character varying(40),
    status character varying(255) DEFAULT 'enabled'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE ONLY public.service_request_comments ALTER COLUMN id SET DEFAULT nextval('public.service_request_comments_id_seq'::regclass);

ALTER TABLE ONLY public.app_attachments
    ADD CONSTRAINT app_attachments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_departments
    ADD CONSTRAINT app_departments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_groups
    ADD CONSTRAINT app_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_modules
    ADD CONSTRAINT app_modules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_roles
    ADD CONSTRAINT app_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_roles
    ADD CONSTRAINT app_roles_role_key UNIQUE (role);

ALTER TABLE ONLY public.app_services
    ADD CONSTRAINT app_services_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_services
    ADD CONSTRAINT app_services_service_key UNIQUE (service);

ALTER TABLE ONLY public.application_app_roles
    ADD CONSTRAINT application_app_roles_pkey PRIMARY KEY (application_id, role_id);

ALTER TABLE ONLY public.application_app_services
    ADD CONSTRAINT application_app_services_pkey PRIMARY KEY (application_id, service_id);

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_application_name_key UNIQUE (application_name);

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.assignment_group_members
    ADD CONSTRAINT assignment_group_members_pkey PRIMARY KEY (group_id, user_id);

ALTER TABLE ONLY public.assignment_groups
    ADD CONSTRAINT assignment_groups_group_name_key UNIQUE (group_name);

ALTER TABLE ONLY public.assignment_groups
    ADD CONSTRAINT assignment_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_environment_name_key UNIQUE (environment_name);

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.gxp_groups
    ADD CONSTRAINT gxp_groups_name_key UNIQUE (name);

ALTER TABLE ONLY public.gxp_groups
    ADD CONSTRAINT gxp_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.gxp_user_access_groups
    ADD CONSTRAINT gxp_user_access_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.gxp_users
    ADD CONSTRAINT gxp_users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.service_request_attachments
    ADD CONSTRAINT service_request_attachments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.service_request_comments
    ADD CONSTRAINT service_request_comments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.service_request_counters
    ADD CONSTRAINT service_request_counters_pkey PRIMARY KEY (application_id);

ALTER TABLE ONLY public.service_request_modules
    ADD CONSTRAINT service_request_modules_pkey PRIMARY KEY (service_request_id, module_id);

ALTER TABLE ONLY public.service_request_roles
    ADD CONSTRAINT service_request_roles_pkey PRIMARY KEY (service_request_id, role_id);

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_service_request_id_key UNIQUE (service_request_id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_name_key UNIQUE (supplier_name);

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_workflow_name_key UNIQUE (workflow_name);

CREATE UNIQUE INDEX app_attachments_app_file_idx ON public.app_attachments USING btree (application_id, attachment);

CREATE UNIQUE INDEX app_departments_app_dept_idx ON public.app_departments USING btree (application_id, department_name);

CREATE UNIQUE INDEX app_groups_app_group_idx ON public.app_groups USING btree (application_id, app_group);

CREATE UNIQUE INDEX app_modules_app_name_idx ON public.app_modules USING btree (application_id, module_name);

CREATE INDEX app_modules_created_at_idx ON public.app_modules USING btree (created_at);

CREATE INDEX app_modules_module_name_trgm_idx ON public.app_modules USING gin (module_name public.gin_trgm_ops);

CREATE UNIQUE INDEX app_roles_role_idx ON public.app_roles USING btree (role);

CREATE UNIQUE INDEX app_services_service_idx ON public.app_services USING btree (service);

CREATE INDEX applications_application_id_trgm_idx ON public.applications USING gin (application_id public.gin_trgm_ops);

CREATE INDEX applications_application_name_trgm_idx ON public.applications USING gin (application_name public.gin_trgm_ops);

CREATE INDEX applications_created_at_idx ON public.applications USING btree (created_at);

CREATE UNIQUE INDEX applications_name_idx ON public.applications USING btree (application_name);

CREATE INDEX assignment_groups_created_at_idx ON public.assignment_groups USING btree (created_at);

CREATE INDEX assignment_groups_description_trgm_idx ON public.assignment_groups USING gin (description public.gin_trgm_ops);

CREATE INDEX assignment_groups_group_name_trgm_idx ON public.assignment_groups USING gin (group_name public.gin_trgm_ops);

CREATE UNIQUE INDEX assignment_groups_name_idx ON public.assignment_groups USING btree (group_name);

CREATE INDEX environments_created_at_idx ON public.environments USING btree (created_at);

CREATE INDEX environments_description_trgm_idx ON public.environments USING gin (description public.gin_trgm_ops);

CREATE INDEX environments_environment_name_trgm_idx ON public.environments USING gin (environment_name public.gin_trgm_ops);

CREATE UNIQUE INDEX environments_name_idx ON public.environments USING btree (environment_name);

CREATE INDEX gxp_groups_parent_group_id ON public.gxp_groups USING btree (parent_group_id);

CREATE UNIQUE INDEX gxp_user_access_groups_gxp_user_id_group_id ON public.gxp_user_access_groups USING btree (gxp_user_id, group_id);

CREATE UNIQUE INDEX gxp_users_auth_id_type_idx ON public.gxp_users USING btree (auth_user_id, user_type);

CREATE INDEX gxp_users_created_at_idx ON public.gxp_users USING btree (created_at);

CREATE INDEX gxp_users_description_trgm_idx ON public.gxp_users USING gin (description public.gin_trgm_ops);

CREATE INDEX gxp_users_user_name_trgm_idx ON public.gxp_users USING gin (user_name public.gin_trgm_ops);

CREATE UNIQUE INDEX service_req_attachments_req_file_idx ON public.service_request_attachments USING btree (service_request_id, attachment);

CREATE INDEX service_requests_created_at_idx ON public.service_requests USING btree (created_at);

CREATE INDEX service_requests_description_trgm_idx ON public.service_requests USING gin (description public.gin_trgm_ops);

CREATE UNIQUE INDEX service_requests_id_idx ON public.service_requests USING btree (service_request_id);

CREATE INDEX service_requests_service_request_id_trgm_idx ON public.service_requests USING gin (service_request_id public.gin_trgm_ops);

CREATE INDEX service_requests_short_description_trgm_idx ON public.service_requests USING gin (short_description public.gin_trgm_ops);

CREATE INDEX suppliers_created_at_idx ON public.suppliers USING btree (created_at);

CREATE INDEX suppliers_description_trgm_idx ON public.suppliers USING gin (description public.gin_trgm_ops);

CREATE UNIQUE INDEX suppliers_name_idx ON public.suppliers USING btree (supplier_name);

CREATE INDEX suppliers_supplier_name_trgm_idx ON public.suppliers USING gin (supplier_name public.gin_trgm_ops);

CREATE INDEX workflows_created_at_idx ON public.workflows USING btree (created_at);

CREATE INDEX workflows_description_trgm_idx ON public.workflows USING gin (description public.gin_trgm_ops);

CREATE UNIQUE INDEX workflows_name_idx ON public.workflows USING btree (workflow_name);

CREATE INDEX workflows_workflow_name_trgm_idx ON public.workflows USING gin (workflow_name public.gin_trgm_ops);

ALTER TABLE ONLY public.app_attachments
    ADD CONSTRAINT app_attachments_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_departments
    ADD CONSTRAINT app_departments_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_groups
    ADD CONSTRAINT app_groups_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_modules
    ADD CONSTRAINT app_modules_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.application_app_roles
    ADD CONSTRAINT application_app_roles_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.application_app_roles
    ADD CONSTRAINT application_app_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.app_roles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.application_app_services
    ADD CONSTRAINT application_app_services_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.application_app_services
    ADD CONSTRAINT application_app_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.app_services(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_access_group_id_fkey FOREIGN KEY (access_group_id) REFERENCES public.gxp_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_application_environment_id_fkey FOREIGN KEY (application_environment_id) REFERENCES public.environments(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_application_workflow_id_fkey FOREIGN KEY (application_workflow_id) REFERENCES public.workflows(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_assignment_group_id_fkey FOREIGN KEY (assignment_group_id) REFERENCES public.assignment_groups(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.assignment_group_members
    ADD CONSTRAINT assignment_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.assignment_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gxp_groups
    ADD CONSTRAINT gxp_groups_parent_group_id_fkey FOREIGN KEY (parent_group_id) REFERENCES public.gxp_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.gxp_user_access_groups
    ADD CONSTRAINT gxp_user_access_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.gxp_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.gxp_user_access_groups
    ADD CONSTRAINT gxp_user_access_groups_gxp_user_id_fkey FOREIGN KEY (gxp_user_id) REFERENCES public.gxp_users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.gxp_users
    ADD CONSTRAINT gxp_users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.gxp_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.service_request_attachments
    ADD CONSTRAINT service_request_attachments_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_comments
    ADD CONSTRAINT service_request_comments_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_counters
    ADD CONSTRAINT service_request_counters_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_modules
    ADD CONSTRAINT service_request_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_modules
    ADD CONSTRAINT service_request_modules_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_roles
    ADD CONSTRAINT service_request_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.app_roles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_request_roles
    ADD CONSTRAINT service_request_roles_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_access_group_id_fkey FOREIGN KEY (access_group_id) REFERENCES public.gxp_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_assignment_group_id_fkey FOREIGN KEY (assignment_group_id) REFERENCES public.assignment_groups(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.environments(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_request_types_id_fkey FOREIGN KEY (request_types_id) REFERENCES public.app_services(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE SET NULL;
`;
