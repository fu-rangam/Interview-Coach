/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                // Elevation System (Paper/Surface)
                'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset', // Low
                'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset', // Medium
                'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset', // High
                'console': '0 -1px 1px rgba(255,255,255,0.1), 0 20px 50px -10px rgba(0,0,0,0.8)', // Deep raised console

                // Glows (Semantic)
                'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
                'glow-cyan-sm': '0 0 10px rgba(6, 182, 212, 0.5)',
                'glow-cyan-lg': '0 0 40px rgba(6, 182, 212, 0.4)',
                'glow-purple': '0 0 20px rgba(147, 51, 234, 0.5)',
                'glow-red': '0 0 40px rgba(239, 68, 68, 0.4)',
                'glow-green': '0 0 20px rgba(34, 197, 94, 0.5)',
            },
            colors: {
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
                rangam: {
                    blue: "#376497",
                    green: "#0B8039",
                    orange: "#C75000",
                },
                // Liquid Glass Theme Colors
                glass: {
                    bg: "var(--glass-bg)",
                    border: "var(--glass-border)",
                },
                glow: {
                    cyan: "var(--glow-cyan)",
                    purple: "var(--glow-purple)",
                    pink: "var(--glow-pink)",
                }
            },
            animation: {
                'glow-pulse': 'glow-pulse 3s infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { opacity: '0.8' },
                    '50%': { opacity: '0.4' },
                }
            },
        },
    },
    plugins: [],
}
