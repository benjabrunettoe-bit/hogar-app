/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF3DE",
          100: "#C0DD97",
          200: "#97C459",
          400: "#639922",
          600: "#3B6D11",
          800: "#27500A",
          900: "#173404",
        },
      },
    },
  },
  plugins: [],
};
