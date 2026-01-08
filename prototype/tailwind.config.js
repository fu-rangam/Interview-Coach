/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
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
            }
        },
    },
    plugins: [],
}
