import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // CiaoEnergy, XS Energy y eSpring: material de referencia sin versionar.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "CiaoEnergy/**", "XS Energy/**", "eSpring/**"],
  },
];

export default eslintConfig;
