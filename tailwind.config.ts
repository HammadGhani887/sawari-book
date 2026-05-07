import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0F172A",
          surface: "#1E293B",
          elevated: "#334155",
        },
        accent: {
          green: "#10B981",
          greenDim: "rgba(16,185,129,0.12)",
          blue: "#3B82F6",
          blueDim: "rgba(59,130,246,0.12)",
        },
        status: {
          amber: "#F59E0B",
          amberDim: "rgba(245,158,11,0.12)",
          red: "#EF4444",
          redDim: "rgba(239,68,68,0.12)",
        },
        platform: {
          indrive: "#2DB543",
          yango: "#FFC107",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
