-- The postgres image only creates the single database named by POSTGRES_DB
-- (umbrella_auth_db). gxp-service needs a second one, and connects to BOTH:
-- its own gxp_workflow_db plus umbrella_auth_db as a read-only reference.
-- Scripts in /docker-entrypoint-initdb.d run once, on first cluster init only.
CREATE DATABASE gxp_workflow_db;
