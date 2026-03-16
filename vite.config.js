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
  host: true,
  port: 5173,
  allowedHosts: ['poscoffee.zethas.my.id'],
    hmr: {
      port: process.env.VITE_HMR_PORT || 24679
      }
    }
  };
});
export {
  stdin_default as default
};
