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
        // Background colors
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Pixel art theme colors
        pixel: {
          bg: {
            primary: "#0f0f1a",
            secondary: "#1a1a2e",
            card: "#16213e",
          },
          accent: {
            green: "#00ff41",
            pink: "#ff0080",
            cyan: "#00ffff",
            yellow: "#ffd93d",
            red: "#ff6b6b",
            purple: "#a855f7",
          },
          text: {
            primary: "#ffffff",
            secondary: "#a0a0a0",
            muted: "#666666",
          },
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "pixel-xs": ["8px", { lineHeight: "12px" }],
        "pixel-sm": ["10px", { lineHeight: "16px" }],
        "pixel-base": ["12px", { lineHeight: "20px" }],
        "pixel-lg": ["14px", { lineHeight: "24px" }],
        "pixel-xl": ["16px", { lineHeight: "28px" }],
        "pixel-2xl": ["20px", { lineHeight: "32px" }],
        "pixel-3xl": ["24px", { lineHeight: "36px" }],
      },
      boxShadow: {
        pixel: "4px 4px 0px 0px rgba(0, 255, 65, 0.5)",
        "pixel-sm": "2px 2px 0px 0px rgba(0, 255, 65, 0.5)",
        "pixel-pink": "4px 4px 0px 0px rgba(255, 0, 128, 0.5)",
        "pixel-cyan": "4px 4px 0px 0px rgba(0, 255, 255, 0.5)",
        glow: "0 0 20px rgba(0, 255, 65, 0.3)",
        "glow-pink": "0 0 20px rgba(255, 0, 128, 0.3)",
        "glow-cyan": "0 0 20px rgba(0, 255, 255, 0.3)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        scanline: "scanline 8s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 65, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 255, 65, 0.6)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
