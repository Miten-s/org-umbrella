import type { GxpUserContext } from "../../services/user-context.service";

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticate` — identity only, straight off the platform JWT. */
      user?: {
        id: string;
        email?: string;
      };
      /** Set by `authorize` — the resolved GXP access context. Present on every entity
       * route; absent means the route is unguarded, which is a bug. */
      access?: GxpUserContext;
    }
  }
}

export {};
