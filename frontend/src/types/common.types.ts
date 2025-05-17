export type Permission = {
  _id: string;
  name: string;
  description: string;
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
  'de' = 'de',
  'es' = 'es',
  'fr' = 'fr',
  'he' = 'he',
  'it' = 'it',
  'hi' = 'hi',   
  'gu' = 'gu',   
  'ta' = 'ta',   
  'te' = 'te',   
  'mr' = 'mr',   
}

