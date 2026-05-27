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
        neongreen: { DEFAULT: "#e6c229", foreground: "#0F0F0E" },
        hotpink: { DEFAULT: "#d11149", foreground: "#FAF9F5" },
        neonyellow: { DEFAULT: "#e6c229", foreground: "#0F0F0E" },
        cyanaccent: { DEFAULT: "#1a8fe3", foreground: "#FAF9F5" },
        neonorange: { DEFAULT: "#f17105", foreground: "#FAF9F5" },
        mixtapeblack: { DEFAULT: "#0F0F0E", foreground: "#FAF9F5" },
        mixtapewhite: { DEFAULT: "#FAF9F5", foreground: "#0F0F0E" },

        wrappedyellow: { DEFAULT: "#e6c229", foreground: "#0F0F0E" },
        wrappedorange: { DEFAULT: "#f17105", foreground: "#FAF9F5" },
        wrappedred: { DEFAULT: "#d11149", foreground: "#FAF9F5" },
        wrappedpurple: { DEFAULT: "#6610f2", foreground: "#FAF9F5" },
        wrappedblue: { DEFAULT: "#1a8fe3", foreground: "#FAF9F5" },
        wrappedblack: { DEFAULT: "#0F0F0E", foreground: "#FAF9F5" },
        wrappedwhite: { DEFAULT: "#FAF9F5", foreground: "#0F0F0E" },
        wrappedgrey: { DEFAULT: "#7F7F7F", foreground: "#FAF9F5" },
        wrappedlightgrey: { DEFAULT: "#E5E5E5", foreground: "#0F0F0E" },
        
        // Retain semantic mappings but override for dynamic Wrapped theme
        primary: { DEFAULT: "#0F0F0E", foreground: "#FAF9F5" },
        secondary: { DEFAULT: "#6610f2", foreground: "#FAF9F5" },
        warning: { DEFAULT: "#e6c229", foreground: "#0F0F0E" },
        cream: { DEFAULT: "#FAF9F5", foreground: "#0F0F0E" },
        teal: { DEFAULT: "#0F0F0E", foreground: "#FAF9F5" },
        crimson: { DEFAULT: "#d11149", foreground: "#FAF9F5" },
      },
      fontFamily: {
        "noto-emoji": ['"Noto Color Emoji"', "sans-serif"],
        mixtape: ["Space Grotesk", "sans-serif"],
        mono: ["Space Grotesk", "sans-serif"],
        scribble: ["Space Grotesk", "sans-serif"],
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
            foreground: "#0F0F0E",
            primary: {
              DEFAULT: "#0F0F0E",
              foreground: "#FAF9F5",
            },
            secondary: {
              DEFAULT: "#71db00",
              foreground: "#0F0F0E",
            },
            warning: {
              DEFAULT: "#ffd500",
              foreground: "#0F0F0E",
            },
            divider: "#0F0F0E",
            focus: "#0F0F0E",
          },
        },
        dark: {
          colors: {
            background: "#1E1E1E",
            foreground: "#FAF9F5",
            primary: {
              DEFAULT: "#FAF9F5",
              foreground: "#0F0F0E",
            },
            secondary: {
              DEFAULT: "#c11cfc",
              foreground: "#FAF9F5",
            },
            warning: {
              DEFAULT: "#ffd500",
              foreground: "#0F0F0E",
            },
            divider: "#FAF9F5",
            focus: "#FAF9F5",
          },
        },
      },
    }),
  ],
};
