import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sun Road Brand Colors
        sunroad: {
          cream: "#f5f5dc",        // Main background color
          amber: {
            50: "#fffbeb",
            100: "#fef3c7", 
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",        // Primary brand color
            700: "#b45309",
            800: "#92400e",
            900: "#78350f",
          },
          brown: {
            50: "#fdf8f6",
            100: "#f2e8e5",
            200: "#eaddd7",
            300: "#e0cec7",
            400: "#d2bab0",
            500: "#bfa094",
            600: "#a18072",
            700: "#977669",
            800: "#846358",
            900: "#43302b",
          }
        },
        // Shadcn/ui colors (keeping for compatibility)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom spacing for consistent design
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Modern, bold, artistic fonts
      fontFamily: {
        'display': ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'], // Modern, bold headings
        'body': ['var(--font-inter)', 'system-ui', 'sans-serif'], // Clean sans for body
        'artistic': ['var(--font-outfit)', 'system-ui', 'sans-serif'], // Bold, artistic sans
        'bold': ['var(--font-poppins)', 'system-ui', 'sans-serif'], // Bold, modern sans
      },
      // Elegant, subtle animations
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'float-slow': 'float 25s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 6s ease-in-out infinite',
        'drift': 'drift 30s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg) scale(1)' },
          '50%': { transform: 'translateY(-6px) rotate(0.3deg) scale(1.02)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
          '33%': { transform: 'translateX(8px) translateY(-4px)' },
          '66%': { transform: 'translateX(-4px) translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(217, 119, 6, 0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(217, 119, 6, 0.2)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
