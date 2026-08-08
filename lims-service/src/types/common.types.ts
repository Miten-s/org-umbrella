export interface AppError extends Error {
  statusCode?: number;
}

export interface AuditContext {
  entityName: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  changeReason?: string;
  performedBy: string;
  performedByName: string;
}
