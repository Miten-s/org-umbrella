export type AppError = {
  message: string;
  statusCode?: number;
  stack?: string;
  [key: string]: any;
};

export enum STATUS {
  ENABLED = "enabled",
  DISABLED = "disabled"
}
