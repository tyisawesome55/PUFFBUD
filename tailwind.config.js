/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "primary-hover": "#2563eb",
        sage: {
          50: "#f6f7f6",
          100: "#e3e8e3",
          200: "#c7d2c7",
          300: "#a3b5a3",
          400: "#7a927a",
          500: "#5a7a5a",
          600: "#4a6b4a",
          700: "#3d5a3d",
          800: "#334a33",
          900: "#2b3e2b",
          950: "#162216",
        },
      },
      borderRadius: {
        container: "0.75rem",
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [],
};
