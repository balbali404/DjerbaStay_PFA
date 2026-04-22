import "dotenv/config";

import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`DjerbaStay backend running on http://localhost:${env.port}`);
});
