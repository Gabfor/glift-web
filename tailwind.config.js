/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", // Ajouté si tu bosses dans /src
  ],
  theme: {
    extend: {
      boxShadow: {
        'glift': '0px 3px 6px rgba(93, 100, 148, 0.15)',
        'glift-hover': '0px 5px 21px rgba(93, 100, 148, 0.15)',
      },
    },
  },
  plugins: [],
};
