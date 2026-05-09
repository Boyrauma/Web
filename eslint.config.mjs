const browserGlobals = {
  AbortController: "readonly",
  Blob: "readonly",
  EventSource: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  alert: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  confirm: "readonly",
  console: "readonly",
  crypto: "readonly",
  document: "readonly",
  fetch: "readonly",
  FileReader: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  sessionStorage: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  TextDecoder: "readonly",
  TextEncoder: "readonly",
  window: "readonly"
};

const nodeGlobals = {
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  fetch: "readonly",
  process: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly"
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "apps/backend/prisma/migrations/**"
    ]
  },
  {
    files: ["apps/admin/src/**/*.{js,jsx}", "apps/frontend/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: browserGlobals
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off"
    }
  },
  {
    files: ["apps/backend/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: nodeGlobals
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off"
    }
  }
];
