import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

var stdin_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },
    server: {
      host: true, // ensures Vite binds to all network interfaces
      allowedHosts: ['poscoffee.zethas.my.id'], // add your hostname here
    port: 5173, // optional: your dev server port
      hmr: process.env.DISABLE_HMR !== "true"
    }
  };
});
export {
  stdin_default as default
};
