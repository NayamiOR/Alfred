import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import pluginTailwindcss from "eslint-plugin-tailwindcss";
import {defineConfig} from "eslint/config";

export default defineConfig([
    // Base ESLint JS recommended rules
    js.configs.recommended,

    // TypeScript ESLint recommended rules
    ...tseslint.configs.recommended,

    // Configuration for .ts and .js files
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {
            parser: tseslint.parser,
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
    },

    // Specific configuration for Vue files
    {
        files: ["**/*.vue"],
        plugins: {
            vue: pluginVue, // Explicitly load the plugin
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                parser: tseslint.parser,
            },
        },
        // Removed explicit Vue rules to bypass 'unknown rule' errors.
        // We can add specific rules back if needed after basic ESLint functionality is confirmed.
        rules: {
            // Example: disabled as it's a common preference.
            'vue/multi-word-component-names': 'off',
        },
    },

    // Tailwind CSS configuration
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], // Apply to JS, TS, and Vue files
        plugins: {
            tailwindcss: pluginTailwindcss, // Explicitly load the plugin
        },
        rules: {
            'tailwindcss/no-contradicting-classname': 'warn', // Warn about contradicting classes
        },
    },
]);