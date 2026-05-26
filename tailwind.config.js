import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        mobile: { max: "767px" },
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      colors: {
        primary: { DEFAULT: "#335C67", foreground: "#FFEAB8" },
        secondary: { DEFAULT: "#9E2A2B", foreground: "#FFEAB8" },
        warning: { DEFAULT: "#FAA307", foreground: "#FFEAB8" },
        cream: { DEFAULT: "#FFEAB8", foreground: "#335C67" },
        teal: { DEFAULT: "#335C67", foreground: "#FFEAB8" },
        crimson: { DEFAULT: "#9E2A2B", foreground: "#FFEAB8" },
      },
      fontFamily: {
        "noto-emoji": ['"Noto Color Emoji"', "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#FAF9F5",
            foreground: "#1A1A1A",
            primary: {
              DEFAULT: "#335C67",
              foreground: "#FAF9F5",
            },
            secondary: {
              DEFAULT: "#9E2A2B",
              foreground: "#FAF9F5",
            },
            warning: {
              DEFAULT: "#FAA307",
              foreground: "#1A1A1A",
            },
            divider: "#E5E1D8",
            focus: "#335C67",
          },
        },
        dark: {
          colors: {
            background: "#0F191B",
            foreground: "#FAF9F5",
            primary: {
              DEFAULT: "#335C67",
              foreground: "#FAF9F5",
            },
            secondary: {
              DEFAULT: "#9E2A2B",
              foreground: "#FAF9F5",
            },
            warning: {
              DEFAULT: "#FAA307",
              foreground: "#1A1A1A",
            },
            divider: "#263B3F",
            focus: "#FFEAB8",
          },
        },
      },
    }),
  ],
};
