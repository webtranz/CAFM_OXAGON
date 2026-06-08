import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  process.env.DATABASE_URL = process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.DATABASE_PRIVATE_URL
    || "";
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });
}

function runPrisma(args) {
  const prismaBin = existsSync("./node_modules/.bin/prisma") ? "./node_modules/.bin/prisma" : "prisma";
  return run(prismaBin, args);
}

function runNode(args) {
  return run("node", args);
}

async function prepareDatabase() {
  resolveDatabaseUrl();

  if (!process.env.DATABASE_URL) {
    console.log("No database URL found. Starting in demo mode without database initialization.");
    return;
  }

  const host = process.env.DATABASE_URL.replace(/^[^@]*@([^/:?]+).*$/, "$1");
  console.log(`Database URL found. Preparing Prisma schema for host: ${host}`);

  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = runPrisma(["migrate", "deploy"]);
    if (result.status === 0) break;

    if (attempt === maxAttempts) {
      console.log(`Database migration failed after ${maxAttempts} attempts. Trying prisma db push as a schema fallback.`);
      const push = runPrisma(["db", "push", "--accept-data-loss"]);
      if (push.status !== 0) console.log("Database schema push fallback failed. Applying targeted location fallback.");
      break;
    }

    console.log(`Database not ready yet. Retrying migration in 3 seconds... (${attempt}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (process.env.RUN_DB_SEED === "yes") {
    const result = runPrisma(["db", "seed"]);
    if (result.status === 0) console.log("Database seed completed.");
    else console.log("Database seed failed. App will still start; check /api/health for DB status.");
  } else {
    console.log("Database seed skipped. Set RUN_DB_SEED=yes to seed/reset demo data.");
  }

  const locationSchema = runNode(["scripts/ensure-location-schema.mjs"]);
  if (locationSchema.status === 0) console.log("Location schema check completed.");
  else console.log("Location schema check failed. App will still start; review database logs.");
}

function startServer() {
  const serverEntry = existsSync("./server.js")
    ? "./server.js"
    : existsSync("./.next/standalone/server.js")
      ? "./.next/standalone/server.js"
      : null;

  if (!serverEntry) {
    console.error("Unable to find Next.js server entry. Build the app before starting.");
    process.exit(1);
  }

  const child = spawn("node", [serverEntry], { stdio: "inherit" });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

await prepareDatabase();
startServer();
