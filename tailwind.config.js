/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep modern grays (VisionOS/Raycast inspired)
        dark: {
          950: "#080A0D",
          900: "#0E1116",
          850: "#141820",
          800: "#1A1F2E",
          700: "#252B3B",
          600: "#343B4F",
        },
        // Neon accent colors
        neon: {
          blue: "#3D7CFF",
          cyan: "#4CC9F0",
          purple: "#6E44FF",
          pink: "#F72585",
          green: "#06FFA5",
        },
        // Glass morphism
        glass: {
          bg: "rgba(20, 24, 32, 0.75)",
          "bg-light": "rgba(30, 35, 45, 0.6)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.15)",
          hover: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.1)",
        },
        // Primary colors (Apple-style blue)
        primary: {
          DEFAULT: "#3D7CFF",
          dark: "#2D5FCC",
          light: "#5A92FF",
          glow: "rgba(61, 124, 255, 0.4)",
        },
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "12px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
      animation: {
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-out": "fadeOut 0.2s ease-in",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-subtle": "bounceSubtle 0.6s ease-in-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(61, 124, 255, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(61, 124, 255, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.3)",
        "glass-lg": "0 16px 48px 0 rgba(0, 0, 0, 0.5)",
        glow: "0 0 20px rgba(61, 124, 255, 0.3)",
        "glow-strong": "0 0 30px rgba(61, 124, 255, 0.5)",
        "glow-cyan": "0 0 20px rgba(76, 201, 240, 0.4)",
        "glow-purple": "0 0 20px rgba(110, 68, 255, 0.4)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
        "inner-glow": "inset 0 0 10px rgba(61, 124, 255, 0.2)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
