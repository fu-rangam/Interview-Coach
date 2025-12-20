import path from 'path';
import { pathToFileURL } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

console.log("✅ VITE CONFIG LOADED - If you see this, the file is active!");

const apiPlugin = (): Plugin => ({
  name: 'api-proxy-plugin',
  configureServer(server) {
    server.middlewares.use(async (req: any, res: any, next) => {

      if (req.url?.startsWith('/api/')) {
        console.log(`[Vite Middleware] Intercepting: ${req.method} ${req.url}`);

        try {
          // 1. Body Parsing (for POST/PUT)
          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            try {
              req.body = data ? JSON.parse(data) : {};
            } catch (e) {
              req.body = {};
            }
          }

          // 2. Response Wrapper
          const wrappedRes = {
            status: (code: number) => {
              res.statusCode = code;
              return wrappedRes;
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return wrappedRes;
            }
          };


          // 3. Resolve and Call Handler
          const url = new URL(req.url, 'http://localhost');
          const endpoint = url.pathname.replace('/api/', '');

          // Use Vite's module loader which supports TS
          // Path should be root-relative, e.g., /api/endpoint.ts
          let modulePath = `/api/${endpoint}`;
          // Try adding .ts if not present (we assume it's a TS file in api/)
          if (!modulePath.endsWith('.ts') && !modulePath.endsWith('.js')) {
            modulePath += '.ts';
          }

          console.log(`[Vite Middleware] Loading handler via ssrLoadModule: ${modulePath}`);

          const { default: handler } = await server.ssrLoadModule(modulePath);

          if (!handler) {
            throw new Error(`No default exportHandler found for ${modulePath}`);
          }

          await handler(req, wrappedRes);

        } catch (error: any) {
          console.error("[Vite Middleware] Error:", error);
          if (error.code === 'ERR_MODULE_NOT_FOUND') {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `Endpoint not found: ${req.url}` }));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Middleware Error', details: error.message }));
          }
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
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

  const key = process.env.GEMINI_API_KEY;
  if (key) {
    console.log(`[Vite Config] GEMINI_API_KEY loaded. Length: ${key?.length}, Starts with: ${key?.substring(0, 5)}...`);
  } else {
    console.warn("[Vite Config] GEMINI_API_KEY could not be found in env!");
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
