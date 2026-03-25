import { createApp } from "../server/index.js";

const appPromise = createApp();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
