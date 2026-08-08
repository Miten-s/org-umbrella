declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        fullName: string;
        email: string;
        roles?: any[];
      };
      auditContext?: {
        entityName?: string;
        entityId?: string;
        changeReason?: string;
        oldValue?: any;
      };
    }
  }
}

export {};
