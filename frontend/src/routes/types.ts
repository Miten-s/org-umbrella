import { ReactNode } from 'react';

export interface AppRoute {
  path: string;
  index?: boolean;
  element?: ReactNode;
  children?: AppRoute[];

  // For sidebar rendering
  title?: string;
  icon?: ReactNode;
  showInSidebar?: boolean;
}
