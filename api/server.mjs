import { createApp } from '../server_dist/index.js';

let appPromise = createApp();

async function getApp() {
  try {
    return await appPromise;
  } catch (error) {
    // Reset so the next request can retry initialization
    appPromise = undefined;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    if (!appPromise) {
      appPromise = createApp();
    }

    const app = await getApp();
    app(req, res);
  } catch (error) {
    // SECURITY: avoid leaking internal error details to clients
    // eslint-disable-next-line no-console
    console.error('Failed to initialize application', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}
