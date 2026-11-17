import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'out', 'release', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['electron/**/*.ts', '*.config.{ts,mts}'],
    languageOptions: { globals: globals.node },
  },
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
);
