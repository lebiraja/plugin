/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
        display: ["Instrument Serif", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // shadcn-native semantic tokens (CSS variables defined in index.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Apple Liquid Glass - Deep dark base colors (legacy)
        dark: {
          950: "#050507",
          900: "#0a0a0e",
          850: "#0f1014",
          800: "#14151a",
          700: "#1c1d24",
          600: "#26272f",
          500: "#32343d",
        },
        // Apple-style accent colors (legacy; renamed to avoid clashing with the
        // shadcn semantic `accent` token above)
        apple: {
          blue: "#0A84FF",
          indigo: "#5E5CE6",
          purple: "#BF5AF2",
          pink: "#FF2D55",
          red: "#FF453A",
          orange: "#FF9F0A",
          yellow: "#FFD60A",
          green: "#30D158",
          teal: "#64D2FF",
          cyan: "#5AC8FA",
        },
        // Liquid Glass material system
        liquid: {
          // Background materials with translucency
          bg: "rgba(10, 10, 14, 0.72)",
          "bg-elevated": "rgba(20, 21, 26, 0.82)",
          "bg-secondary": "rgba(28, 29, 36, 0.65)",
          "bg-tertiary": "rgba(38, 39, 47, 0.55)",
          // Frosted surfaces
          frosted: "rgba(255, 255, 255, 0.03)",
          "frosted-light": "rgba(255, 255, 255, 0.06)",
          "frosted-strong": "rgba(255, 255, 255, 0.09)",
          // Border/separator colors with glass refraction effect
          border: "rgba(255, 255, 255, 0.06)",
          "border-subtle": "rgba(255, 255, 255, 0.04)",
          "border-strong": "rgba(255, 255, 255, 0.12)",
          "border-glow": "rgba(10, 132, 255, 0.25)",
          // Hover/active states
          hover: "rgba(255, 255, 255, 0.04)",
          active: "rgba(255, 255, 255, 0.08)",
          pressed: "rgba(255, 255, 255, 0.12)",
          // Specular highlights for glass reflections
          specular: "rgba(255, 255, 255, 0.15)",
          "specular-strong": "rgba(255, 255, 255, 0.25)",
        },
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "20px",
        md: "30px",
        lg: "40px",
        xl: "60px",
        "2xl": "80px",
        "3xl": "100px",
      },
      backdropSaturate: {
        180: "1.8",
        200: "2",
      },
      animation: {
        // Liquid Glass motion animations
        "liquid-in": "liquidIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "liquid-out": "liquidOut 0.3s cubic-bezier(0.36, 0, 0.66, -0.56)",
        "glass-float": "glassFloat 3s ease-in-out infinite",
        "glass-shimmer": "glassShimmer 2.5s ease-in-out infinite",
        "refract": "refract 4s ease-in-out infinite",
        "depth-pulse": "depthPulse 2s ease-in-out infinite",
        // Standard animations
        "slide-up": "slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fadeIn 0.25s ease-out",
        "fade-out": "fadeOut 0.2s ease-in",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-out": "scaleOut 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        "morph": "morph 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        // Liquid Glass specific keyframes
        liquidIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.92) translateY(8px)",
            filter: "blur(4px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
            filter: "blur(0)",
          },
        },
        liquidOut: {
          "0%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
          "100%": {
            opacity: "0",
            transform: "scale(0.95)",
            filter: "blur(2px)",
          },
        },
        glassFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        glassShimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        refract: {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
            filter: "hue-rotate(0deg)",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            filter: "hue-rotate(5deg)",
          },
        },
        depthPulse: {
          "0%, 100%": {
            boxShadow: "0 0 0 1px rgba(10, 132, 255, 0.1), 0 4px 20px rgba(0, 0, 0, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 0 1px rgba(10, 132, 255, 0.2), 0 8px 30px rgba(0, 0, 0, 0.4)",
          },
        },
        // Standard keyframes
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-16px)", opacity: "0" },
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
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        morph: {
          "0%": { borderRadius: "20px" },
          "50%": { borderRadius: "24px" },
          "100%": { borderRadius: "20px" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(10, 132, 255, 0.2), 0 0 40px rgba(10, 132, 255, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(10, 132, 255, 0.35), 0 0 60px rgba(10, 132, 255, 0.15)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        // Liquid Glass shadow system (depth layering)
        "liquid-sm": "0 2px 8px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.15)",
        "liquid": "0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2)",
        "liquid-md": "0 8px 24px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.2)",
        "liquid-lg": "0 12px 40px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.25)",
        "liquid-xl": "0 20px 60px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3)",
        // Glass-specific shadows with refraction hints
        "glass": "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glass-inset": "inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
        "glass-glow": "0 0 0 1px rgba(10, 132, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.35)",
        // Glow effects
        "glow": "0 0 20px rgba(10, 132, 255, 0.25)",
        "glow-strong": "0 0 30px rgba(10, 132, 255, 0.4)",
        "glow-accent": "0 0 25px rgba(10, 132, 255, 0.35)",
        // Inner shadows for depth
        "inner-soft": "inset 0 2px 4px rgba(0, 0, 0, 0.15)",
        "inner-glow": "inset 0 0 12px rgba(10, 132, 255, 0.15)",
      },
      borderRadius: {
        // shadcn radius scale, driven by --radius
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // legacy fixed radii
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
        "5xl": "36px",
      },
      backgroundImage: {
        // Liquid Glass gradients
        "liquid-gradient": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)",
        "liquid-shimmer": "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        "glass-refract": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, rgba(255,255,255,0.05) 100%)",
        "depth-gradient": "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
        // Radial gradients for glass effects
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(10, 132, 255, 0.15) 0%, transparent 60%)",
        "radial-light": "radial-gradient(ellipse at 50% -20%, rgba(255, 255, 255, 0.08) 0%, transparent 70%)",
        // Standard gradients
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      transitionTimingFunction: {
        "liquid": "cubic-bezier(0.22, 1, 0.36, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
