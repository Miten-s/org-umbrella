import i18n from "i18next";
import { i18nextPlugin } from "translation-check";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translations files
import translationEN from "@/public/locales/en/translation.json";
import translationFR from "@/public/locales/fr/translation.json";
import translationGU from "@/public/locales/gu/translation.json";
import translationHI from "@/public/locales/hi/translation.json";
import translationTA from "@/public/locales/ta/translation.json";
import translationTE from "@/public/locales/te/translation.json";
import translationMR from "@/public/locales/mr/translation.json";
import translationES from "@/public/locales/es/translation.json";
import translationAR from "@/public/locales/ar/translation.json";

i18n
  .use(i18nextPlugin)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    // IMPORTANT : Add the translation files for the different languages
    resources: {
      en: {
        translation: translationEN
      },
      fr: {
        translation: translationFR
      },
      gu: {
        translation: translationGU
      },
      hi: {
        translation: translationHI
      },
      ta: {
        translation: translationTA
      },
      te: {
        translation: translationTE
      },
      mr: {
        translation: translationMR
      },
      es: {
        translation: translationES
      },
      ar: {
        translation: translationAR
      }
    },
    fallbackLng: "en",
    load: "languageOnly",
    lng: localStorage.getItem("i18nextLng") || navigator.language,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    //i- added because language are not workig afteer 5 times changes
    react: {
      useSuspense: false,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
      transEmptyNodeValue: ""
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });

export default i18n;
