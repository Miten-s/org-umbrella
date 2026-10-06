import { QueryInterface } from "sequelize";

/** The complete the platform: companies, users, roles, permissions, locations, departments, designations and the RBAC audit log schema. Generated from the final state of the earlier migration
 * history, which was squashed into this one before the first production deploy. Add later
 * changes as new migrations; never edit this one. Runs as one statement batch, so it
 * applies completely or not at all. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(SCHEMA);
};

const SCHEMA = `
CREATE TABLE public.companies (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    logo text,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.departments (
    id uuid NOT NULL,
    department_name character varying(255) NOT NULL,
    department_manager_id uuid,
    department_group_location_id uuid NOT NULL,
    description text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(255),
    modified_on timestamp with time zone,
    modified_by character varying(255),
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.designations (
    id uuid NOT NULL,
    designation_name character varying(255) NOT NULL,
    description text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    modified_on timestamp with time zone,
    modified_by uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.locations (
    id uuid NOT NULL,
    location_name character varying(255) NOT NULL,
    location_code character varying(255),
    description text,
    comments text,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    modified_on timestamp with time zone,
    modified_by uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(255) DEFAULT 'default'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.rbac_audit_log (
    id uuid NOT NULL,
    actor_user_id uuid,
    actor_email character varying(255),
    action character varying(255) NOT NULL,
    target_type character varying(255) NOT NULL,
    target_id character varying(255),
    target_name character varying(255),
    before_state jsonb,
    after_state jsonb,
    reason text,
    created_at timestamp with time zone NOT NULL
);

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) DEFAULT 'Custom'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    code character varying(100),
    description text
);

CREATE TABLE public.user_password_history (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL
);

CREATE SEQUENCE public.user_password_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.user_password_history_id_seq OWNED BY public.user_password_history.id;

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    full_name character varying(255),
    password character varying(255) NOT NULL,
    user_type character varying(255) DEFAULT 'User'::character varying NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    current_language character varying(255) DEFAULT 'en'::character varying NOT NULL,
    description text,
    phone character varying(255),
    department_id uuid,
    designation_id uuid,
    location_id uuid,
    manager_id uuid,
    created_by uuid,
    modified_by uuid,
    modifiable boolean DEFAULT true NOT NULL,
    training_completed boolean DEFAULT false NOT NULL,
    password_expiry_time timestamp with time zone,
    last_login timestamp with time zone,
    signature text,
    deleted_at timestamp with time zone,
    modified_on timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE ONLY public.user_password_history ALTER COLUMN id SET DEFAULT nextval('public.user_password_history_id_seq'::regclass);

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rbac_audit_log
    ADD CONSTRAINT rbac_audit_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_password_history
    ADD CONSTRAINT user_password_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX departments_department_name_active_uq ON public.departments USING btree (department_name) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX designations_designation_name_active_uq ON public.designations USING btree (designation_name) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX locations_location_name_active_uq ON public.locations USING btree (location_name) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX permissions_name_idx ON public.permissions USING btree (name);

CREATE INDEX rbac_audit_log_actor_idx ON public.rbac_audit_log USING btree (actor_user_id);

CREATE INDEX rbac_audit_log_created_at_idx ON public.rbac_audit_log USING btree (created_at);

CREATE INDEX rbac_audit_log_target_idx ON public.rbac_audit_log USING btree (target_type, target_id);

CREATE UNIQUE INDEX roles_name_idx ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_type_code_unique ON public.roles USING btree (type, lower((code)::text)) WHERE (code IS NOT NULL);

CREATE INDEX users_created_at_idx ON public.users USING btree (created_at DESC);

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email);

CREATE INDEX users_status_idx ON public.users USING btree (status);

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_group_location_id_fkey FOREIGN KEY (department_group_location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (department_manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT fk_designations_modifier FOREIGN KEY (modified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT fk_locations_modifier FOREIGN KEY (modified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_password_history
    ADD CONSTRAINT user_password_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.designations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.users(id) ON DELETE SET NULL;
`;
