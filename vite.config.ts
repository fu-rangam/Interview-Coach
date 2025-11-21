import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

console.log("✅ VITE CONFIG LOADED - If you see this, the file is active!");

const ttsPlugin = (): Plugin => ({
  name: 'tts-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req: any, res: any, next) => {
      console.log(`[Vite Middleware] ${req.method} ${req.url}`);

      if (req.url?.startsWith('/api/tts') && req.method === 'POST') {
        console.log("Middleware: Intercepted /api/tts");
        try {
          // 1. Body Parsing
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const data = Buffer.concat(buffers).toString();
          try {
            req.body = JSON.parse(data);
          } catch (e) {
            req.body = {};
          }

          // 2. Response Wrapper (Mock Express/Vercel API)
          const wrappedRes = {
            status: (code: number) => {
              res.statusCode = code;
              return wrappedRes;
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          };

          // 3. Call Handler
          // Dynamic import to avoid build issues if not used
          const { default: ttsHandler } = await import('./api/tts');
          console.log("Middleware: API Key present?", !!process.env.GEMINI_API_KEY);
          await ttsHandler(req, wrappedRes);
        } catch (error) {
          console.error("Middleware Error:", error);
          // @ts-ignore
          if (error?.response) {
            // @ts-ignore
            console.error("Middleware Error Response:", await error.response.text());
          }
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Middleware Error' }));
        }
      } else {
        next();
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), ttsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
