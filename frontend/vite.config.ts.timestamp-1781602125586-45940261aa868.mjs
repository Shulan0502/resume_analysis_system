// vite.config.ts
import { defineConfig } from "file:///E:/BaiduNetdiskDownload/%E8%8B%B1%E8%AF%AD%E5%9B%9B%E7%BA%A7%E5%90%AC%E5%8A%9B/%E6%BA%90%E4%BB%A3%E7%A0%81/mockInterview-main/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///E:/BaiduNetdiskDownload/%E8%8B%B1%E8%AF%AD%E5%9B%9B%E7%BA%A7%E5%90%AC%E5%8A%9B/%E6%BA%90%E4%BB%A3%E7%A0%81/mockInterview-main/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "E:\\BaiduNetdiskDownload\\\u82F1\u8BED\u56DB\u7EA7\u542C\u529B\\\u6E90\u4EE3\u7801\\mockInterview-main\\frontend";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        // 你的后端地址
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxCYWlkdU5ldGRpc2tEb3dubG9hZFxcXFxcdTgyRjFcdThCRURcdTU2REJcdTdFQTdcdTU0MkNcdTUyOUJcXFxcXHU2RTkwXHU0RUUzXHU3ODAxXFxcXG1vY2tJbnRlcnZpZXctbWFpblxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcQmFpZHVOZXRkaXNrRG93bmxvYWRcXFxcXHU4MkYxXHU4QkVEXHU1NkRCXHU3RUE3XHU1NDJDXHU1MjlCXFxcXFx1NkU5MFx1NEVFM1x1NzgwMVxcXFxtb2NrSW50ZXJ2aWV3LW1haW5cXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0JhaWR1TmV0ZGlza0Rvd25sb2FkLyVFOCU4QiVCMSVFOCVBRiVBRCVFNSU5QiU5QiVFNyVCQSVBNyVFNSU5MCVBQyVFNSU4QSU5Qi8lRTYlQkElOTAlRTQlQkIlQTMlRTclQTAlODEvbW9ja0ludGVydmlldy1tYWluL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODEnLCAvLyBcdTRGNjBcdTc2ODRcdTU0MEVcdTdBRUZcdTU3MzBcdTU3NDBcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQWdjLFNBQVMsb0JBQW9CO0FBQzdkLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
