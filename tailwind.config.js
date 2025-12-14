/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Wir werden hier später unsere Nova-spezifischen Farben definieren
                // Basierend auf 'Premium Nature' und 'Tech'
                nova: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9', // Beispiel Primary
                    900: '#0c4a6e',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Modern clean look
            }
        },
    },
    plugins: [],
}
