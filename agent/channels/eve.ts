import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

// Only our own server can open research sessions: Vercel OIDC from this
// project in production, and local requests during development.
export default eveChannel({
  auth: [vercelOidc(), localDev()],
});
