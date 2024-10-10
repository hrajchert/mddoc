import js from "@eslint/js";
import importPlugin from 'eslint-plugin-import';
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {files: ["src/**/*.{js,ts}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.configs.typescript,
  ...tseslint.configs.recommended,
  {
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        typescript: true,
        node: true,
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          },
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type"
          ]
        }
      ]
    }
  },
];