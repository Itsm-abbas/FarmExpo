/** @type {import('eslint').Linter.FlatConfig} */
const eslintConfig = [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    extends: ["eslint:recommended", "next/core-web-vitals"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];

export default eslintConfig;
