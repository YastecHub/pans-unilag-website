/**
 * The API, as one Vercel function. Every /api/* request is rewritten here (vercel.json) and
 * handled by the Express app, which sees the original path. The server is compiled to
 * server/dist by the build command first. Locally, run `npm run dev` instead.
 */
export { default } from '../server/dist/vercel.js'
