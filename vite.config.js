import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-icons'],
          player: ['artplayer', 'hls.js'],
          utils: ['axios', 'cheerio', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
})
