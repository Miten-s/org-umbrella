import i18n from "i18next";
import { i18nextPlugin } from "translation-check";
import { initReactI18next } from "react-i18next";

import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(i18nextPlugin)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      // Set the correct path to the translation files in public
      loadPath: "src/public/locales/{{lng}}/{{ns}}.json"
    },
    fallbackLng: "en",
    debug: false,
    load: "languageOnly",
    lng: navigator.language,
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
