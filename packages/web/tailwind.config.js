/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
  // 设置CSS变量前缀避免与Ant Design冲突
  corePlugins: {
    preflight: false, // 禁用Tailwind的reset样式，避免与Ant Design冲突
  },
};
