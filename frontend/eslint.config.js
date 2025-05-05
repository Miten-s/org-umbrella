import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      "build/*",
      ".yarn/*",
      ".github/*",
      "**/node_modules",
      "**/package.json",
      "**/vite.config.ts",
      "libs/*",
      "libs-jdp/*",]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      "import/imports-first": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        args: "after-used",
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-types": "off",
      "react/jsx-key": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-var-requires": "off",
      "react/prop-types": "off",
      "prefer-const": "off",
      "react/no-children-prop": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "no-var": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/camelcase": "off",
      "@typescript-eslint/class-name-casing": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
    },
  },
)
