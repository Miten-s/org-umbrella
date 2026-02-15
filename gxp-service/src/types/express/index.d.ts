import { IUser } from "../../models/gxp-service-users.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
