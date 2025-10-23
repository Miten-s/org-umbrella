const API_ROUTES = {
  ROOT: "/",
  VERSIONS: {
    v1: "/v1/api"
  },
  GXP_USERS: "/gxp-users",
  GXP_SUPPLIERS: "/gxp-suppliers",
  GXP_ENVIRONMENTS: "/gxp-environments",
  GXP_APPLICATIONS: "/gxp-applications",
  GXP_WORKFLOWS: "/gxp-workflows",
  HEALTH: "/health",
  USER: {
    ROOT: "/",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id"
  },
  SUPPLIER: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id"
  },
  ENVIRONMENT: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id"
  },
  APPLICATIONS: {
    ROOT: "/",
    BY_ID: "/:id",
    ENABLE_BY_ID: "/enable/:id",
    DISABLE_BY_ID: "/disable/:id"
  },
  WORKFLOWS: {
    ROOT: "/",
    SEARCH: "/search",
    BY_ID: "/:workflowId",
    ENABLE_BY_ID: "/enable/:workflowId",
    DISABLE_BY_ID: "/disable/:workflowId"
  }
};

export default API_ROUTES;
