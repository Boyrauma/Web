export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1a365d",
          amber: "#9a5c00",
          gold: "#d3b277",
          slate: "#51606f",
          sky: "#d7e7f8"
        }
      },
      boxShadow: {
        premium: "0 18px 50px -22px rgba(26, 54, 93, 0.35)"
      }
    }
  },
  plugins: []
};
