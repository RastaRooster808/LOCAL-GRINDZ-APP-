import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        lava: {
          50: "#fff3ed",
          100: "#ffe1d2",
          200: "#ffc0a3",
          300: "#ff9666",
          400: "#ff6a33",
          500: "#f7460f",
          600: "#d92f08",
          700: "#b31f09",
          800: "#8f1c10",
          900: "#5c1810",
          950: "#1a0e0a",
        },
        ohia: {
          50: "#eef6ef",
          100: "#d3e8d6",
          200: "#a8d1af",
          300: "#78b384",
          400: "#4d925e",
          500: "#337545",
          600: "#255c36",
          700: "#1f492c",
          800: "#1a3a25",
          900: "#122a1a",
          950: "#0a1710",
        },
        sunrise: {
          50: "#fff8ec",
          100: "#ffecc7",
          200: "#ffd685",
          300: "#ffbb4d",
          400: "#ff9e2e",
          500: "#ff7a1f",
          600: "#f2560f",
          700: "#c93d0f",
          800: "#9f2f14",
          900: "#7c2814",
          950: "#431207",
        },
        night: {
          900: "#120d0c",
          950: "#0a0706",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "lava-flow":
          "linear-gradient(115deg, #1a0e0a 0%, #5c1810 22%, #b31f09 45%, #ff7a1f 60%, #ffbb4d 72%, #5c1810 100%)",
        "sunrise-sky":
          "linear-gradient(180deg, #431207 0%, #c93d0f 35%, #ff9e2e 60%, #ffd685 80%, #fff8ec 100%)",
      },
      keyframes: {
        "lava-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        ember: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.9" },
          "100%": { transform: "translateY(-140px) scale(0.3)", opacity: "0" },
        },
      },
      animation: {
        "lava-shift": "lava-shift 12s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        ember: "ember 4s linear infinite",
      },
      backgroundSize: {
        200: "200% 200%",
      },
    },
  },
  plugins: [],
};

export default config;
