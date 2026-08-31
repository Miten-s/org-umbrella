import type { UserContext } from "../../services/user-context.service";

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticate` — identity only, straight off the JWT. */
      user?: {
        id: string;
        fullName?: string;
        email?: string;
        roles?: string[];
      };
      /** Set by `authorize` — the resolved LIMS access context. Present on every entity
       * route; absent means the route is unguarded, which is a bug. */
      access?: UserContext;
    }
  }
}

export {};
