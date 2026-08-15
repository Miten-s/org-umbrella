#!/bin/sh
# Runs once, on first cluster init only (docker-entrypoint-initdb.d).
# The postgres image only creates one database automatically; every service
# needs its own, plus everyone shares umbrella_auth_db as a read-only
# reference for resolving platform users.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	CREATE DATABASE umbrella_auth_db;
	CREATE DATABASE gxp_workflow_db;
	CREATE DATABASE lims_service_db;
EOSQL
