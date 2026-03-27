import { createApp } from '../server_dist/index.js';

const appPromise = createApp();

export default async function handler(req, res) {
  const app = await appPromise;
  app(req, res);
}
