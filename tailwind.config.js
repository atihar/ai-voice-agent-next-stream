import { mtConfig } from "@material-tailwind/react";

const config = {
    content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}"
  ],
  plugins: [mtConfig],
};

export default config;
