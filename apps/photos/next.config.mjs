/** @type {import('next').NextConfig} */
export default {
  transpilePackages: [
    "@placeholder/ui",
    "@jerryqiu/sites",
    "@jerryqiu/auth",
    "@jerryqiu/db",
    "@jerryqiu/protect",
    "@jerryqiu/storage",
  ],
  serverExternalPackages: ["sharp", "pg", "@electric-sql/pglite"],
};
