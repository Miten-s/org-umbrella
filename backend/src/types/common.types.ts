export type AppError = {
  message: string;
  statusCode?: number;
  stack?: string;
  [key: string]: any;
};
