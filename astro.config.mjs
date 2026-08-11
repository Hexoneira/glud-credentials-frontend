// @ts-check
import { defineConfig } from 'astro/config';
import httpProxy from 'http-proxy';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

const apiProxy = httpProxy.createProxyServer({
  target: 'http://localhost:8080',
  changeOrigin: true
});

const apiDevProxy = {
  name: 'api-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/api', (req, res) => {
      req.url = '/api' + req.url;
      req.headers.origin = 'http://localhost:4321';
      apiProxy.web(req, res);
    });
  }
};

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwindcss(), apiDevProxy]
  },

  integrations: [react()],
});
