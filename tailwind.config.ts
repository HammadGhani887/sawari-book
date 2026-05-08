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
          bg: "#F0F4F8", // Light blue background
          surface: "#FFFFFF", // White surface
          elevated: "#F8FAFC", // Slightly off-white for elevated elements
        },
        accent: {
          green: "#2563EB", // We changed this to Blue to match the Blue & White theme, but kept the variable name to avoid refactoring all components.
          greenDim: "rgba(37,99,235,0.12)",
          blue: "#3B82F6", // Lighter blue for drivers
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
