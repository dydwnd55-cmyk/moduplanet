import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",        // 👈 app 폴더 안의 모든 파일 감지
        "./components/**/*.{js,ts,jsx,tsx,mdx}", // 👈 components 폴더 감지
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
export default config;