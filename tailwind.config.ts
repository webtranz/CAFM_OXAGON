import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        lagoon: "#0f8b8d",
        sun: "#ffd166",
        coral: "#f45d48",
        leaf: "#35a852",
      },
      boxShadow: {
        lift: "0 18px 45px rgba(23, 32, 51, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
