import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const sessionSecret = "e2e-demo-session-secret";
const stateDir = path.join(__dirname, "test-results", "e2e-state");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: `rm -rf ${stateDir} && mkdir -p ${stateDir} && npm run build && npm run start -- --hostname 127.0.0.1 --port 3000`,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      EARS_DEMO_SESSION_SECRET: sessionSecret,
      EARS_ALLOW_DEMO_FAULTS: "1",
      XAI_API_KEY: "",
      EARS_STATE_DIR: stateDir,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
