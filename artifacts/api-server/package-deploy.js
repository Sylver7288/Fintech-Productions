import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log("1. Running esbuild compilation...");
  execSync("pnpm run build", { cwd: __dirname, stdio: "inherit" });

  const tempDir = path.join(__dirname, "deploy-temp");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  console.log("2. Copying bundled assets...");
  fs.copyFileSync(
    path.join(__dirname, "dist", "index.mjs"),
    path.join(tempDir, "index.mjs")
  );
  if (fs.existsSync(path.join(__dirname, "dist", "index.mjs.map"))) {
    fs.copyFileSync(
      path.join(__dirname, "dist", "index.mjs.map"),
      path.join(tempDir, "index.mjs.map")
    );
  }

  console.log("3. Writing deployment Procfile...");
  fs.writeFileSync(path.join(tempDir, "Procfile"), "web: node index.mjs\n");

  console.log("4. Writing custom package.json...");
  const pkg = {
    name: "novamonie-api",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      start: "node index.mjs",
    },
    dependencies: {
      "cookie-parser": "^1.4.7",
      "cors": "^2.8.6",
      "express": "^5.2.1",
      "express-rate-limit": "^8.5.2",
      "helmet": "^8.2.0",
      "nodemailer": "^9.0.1",
      "pino": "^9.14.0",
      "pino-http": "^10.5.0",
    },
  };
  fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  console.log("5. Waiting for OS file locks to release...");
  execSync(`powershell -Command "Start-Sleep -s 2"`);

  console.log("6. Zipping deployment folder into deploy.zip using Compress-Archive...");
  const zipPath = path.join(__dirname, "deploy.zip");
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // PowerShell Compress-Archive command
  execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
    stdio: "inherit",
  });

  console.log("7. Cleaning up temporary files...");
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`\n🎉 Success! packaged deployment archive created at:\n   ${zipPath}\n`);
}

run().catch(console.error);
