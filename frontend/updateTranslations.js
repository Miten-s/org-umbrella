import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const translationsFile = path.join(__dirname, './translations.json');
const languageFilesDir = path.join(__dirname, './src/public/locales');

// Recursive function to merge objects
function mergeObjects(target, source) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] instanceof Object &&
        key in target &&
        target[key] instanceof Object
      ) {
        mergeObjects(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

async function updateTranslations() {
  try {
    const translations = await fs.readJson(translationsFile);

    for (const lang in translations) {
      if (Object.prototype.hasOwnProperty.call(translations, lang)) {
        const translationData = translations[lang];
        const languageFilePath = path.join(languageFilesDir, lang, 'translation.json');

        let languageFile = {};
        try {
          languageFile = await fs.readJson(languageFilePath);
        } catch {
          languageFile = {};
        }

        mergeObjects(languageFile, translationData);
        await fs.writeJson(languageFilePath, languageFile, { spaces: 2 });
      }
    }
  } catch (err) {
    console.error(' Error updating translations:', err);
  }
}

updateTranslations();
