import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        lagoon: "#059669",
        sun: "#f59e0b",
        coral: "#ef4444",
        leaf: "#10b981",
      },
      boxShadow: {
        lift: "0 1px 3px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
