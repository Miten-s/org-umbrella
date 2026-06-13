const API_ROUTES = {
  ROOT: "/",
  VERSIONS: {
    v1: "/v1/api"
  },
  GXP_USERS: "/gxp-users",
  GXP_SUPPLIERS: "/gxp-suppliers",
  GXP_ENVIRONMENTS: "/gxp-environments",
  GXP_APPLICATIONS: "/gxp-applications",
  GXP_APPLICATION_MODULES: "/gxp-application-modules",
  GXP_WORKFLOWS: "/gxp-workflows",
  GXP_SERVICES_REQUESTS: "/gxp-service-requests",
  GXP_ASSIGNMENT_GROUPS: "/gxp-assignment-groups",
  HEALTH: "/health",
  USER: {
    ROOT: "/",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id",
    BULK_DELETE: "/bulk-delete"
  },
  SUPPLIER: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  },
  ENVIRONMENT: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  },
  APPLICATIONS: {
    ROOT: "/",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id",
    DELETE_ATTACHMENTS: "/attachments/:attachmentId",
    GET_APPLICATION_GROUPS: "/application-groups",
    DUPLICATE_BY_ID: "/:id/duplicate",
    GET_APPLICATION_ROLES: "/application-roles",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  },
  WORKFLOWS: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:workflowId",
    ENABLE_BY_ID: "/enable/:workflowId",
    DISABLE_BY_ID: "/disable/:workflowId",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  },
  SERVICE_REQUESTS: {
    ROOT: "/",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id",
    UPDATE_STATUS: "/status/:id",
    GET_SERVICE_TYPES: "/service-types",
    BULK_DELETE: "/bulk-delete"
  },
  ASSIGNMENT_GROUPS: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:groupName",
    DISABLE_BY_ID: "/disable/:groupName",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  },
  APPLICATION_MODULES: {
    ROOT: "/",
    BY_ID: "/:id",
    STATUS_BY_ID: "/status/:id",
    BULK_DELETE: "/bulk-delete",
    BULK_DUPLICATE: "/bulk-duplicate"
  }
};

export default API_ROUTES;
