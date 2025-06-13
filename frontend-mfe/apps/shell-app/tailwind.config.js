/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [
    require('../../tailwind.config.js')
  ]
};