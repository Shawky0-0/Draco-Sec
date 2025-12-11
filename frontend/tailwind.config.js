/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#000000",
                primary: "#ffffff", // Neon White
                defensive: "#00ffff", // Neon Cyan
                secondary: "#0a0a0a",
                sidebar: "#0d0d0d",
                "accent-offensive": "#ff0033", // Neon Red (matching User's previous preference)
                "accent-defensive": "#00ffff", // Neon Cyan
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
