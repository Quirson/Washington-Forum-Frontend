// tailwind.config.js - ATUALIZE:
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                dark: {
                    100: '#0a0a0b',
                    200: '#14141a',
                    300: '#1c1c24',
                    400: '#2a2a36',
                },
                primary: {
                    500: '#0ea5e9',
                    600: '#0284c7',
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#a8a8b3',
                },
                border: {
                    color: '#2a2a36',
                },
            },
            fontFamily: {
                sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
                display: ['Arial Black', 'Impact', 'system-ui', 'sans-serif'],
            },

        },
    },
    plugins: [],
}