import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "supabase/functions"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Warn on any direct Supabase mutations (educational, not enforcement)
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.property.name='insert']",
          message: "Direct .insert() is discouraged. Use RPC functions via callRpc() in service files."
        },
        {
          selector: "CallExpression[callee.property.name='update'][callee.object.callee.property.name='from']",
          message: "Direct .update() is discouraged. Use RPC functions via callRpc() in service files."
        },
        {
          selector: "CallExpression[callee.property.name='delete'][callee.object.callee.property.name='from']",
          message: "Direct .delete() is discouraged. Use RPC functions via callRpc() in service files."
        }
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
);
