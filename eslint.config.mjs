import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  {
    // Build output, dependencies, runtime data and legacy Meteor entry points
    // that are no longer part of the running Next.js application.
    ignores: [
      "node_modules/**",
      ".next/**",
      ".meteor/**",
      ".local-data/**",
      "test-results/**",
      "playwright-report/**",
      "coverage/**",
      "server/**",
      "imports/api/**",
      "imports/startup/**",
      "client/main.jsx",
      "tests/main.js"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    plugins: { react },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    settings: { react: { version: "detect" } },
    rules: {
      // Recognise that JSX uses the imported component/React identifiers.
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^(React|_)", argsIgnorePattern: "^_" }
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }]
    }
  },
  {
    // Vitest globals for the unit/integration suite.
    files: ["tests/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly"
      }
    }
  }
];
