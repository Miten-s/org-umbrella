import { Linter } from "eslint";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import tsParser from "@typescript-eslint/parser";

/** @type {Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser // Use the imported parser
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": "warn"
    },
    ignores: [
      "dist",
      "build",
      ".yarn",
      ".github",
      "**/node_modules",
      "**/package.json",
      "**/vite.config.ts"
    ]
  }
];
