import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Service-role client and secret-holding modules stay server side
  // (architecture.md §11). `server-only` also fails the build if they leak.
  {
    files: ["components/**/*.{ts,tsx}", "**/*.client.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@/lib/supabase/admin", message: "Service-role client is server only." },
            { name: "@/lib/crypto", message: "Token encryption is server only." },
          ],
          patterns: [{ group: ["@/lib/providers/*", "@/lib/ai/*", "@/lib/pipeline/process"], message: "Provider and AI modules hold secrets; call them from a route." }],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not part of the app:
    "ponytail/**",
    ".agent-logs/**",
    "supabase/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
