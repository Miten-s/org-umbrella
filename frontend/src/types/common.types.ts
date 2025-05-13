export type Permission = {
  _id: string;
  name: string;
  description: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export type OptionalTranslations = {
  [K in SupportedLanguages]?: string;
};

// frontend enum must be in this order because of component to set
// default languages in admin panel
export enum SupportedLanguages {
  'en' = 'en',
  'ar' = 'ar',
  'zh' = 'zh',
  'de' = 'de',
  'es' = 'es',
  'fr' = 'fr',
  'he' = 'he',
  'it' = 'it',
  'ja' = 'ja',
  'ko' = 'ko',
  'nl' = 'nl',
  'pl' = 'pl',
  'pt' = 'pt',
}
