const API_ROUTES = {
  ROOT: "/",
  VERSIONS: {
    v1: "/v1/api"
  },
  AUTH: "/auth",
  ME: "/me",
  USER: "/users",
  ROLE: "/roles",
  COMPANY: "/company",
  PERMISSION: "/permissions",
  DESIGNATION: "/designations",
  DEPARTMENTS: "/departments",
  LOCATIONS: "/locations",
  REGISTER: "/register",
  ENABLE: "/enable",
  DISABLE: "/disable",
  LOGIN: "/sign-in",
  LOGOUT: "/sign-out",
  HEALTH: "/health",
  ASSIGN_ROLE: "/assign-role",
  PARAMS: "/:id",
  BULK_DELETE: "/bulk-delete",
  BULK_DUPLICATE: "/bulk-duplicate"
};

export default API_ROUTES;
