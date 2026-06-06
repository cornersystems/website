import { spawnSync } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";

const prompt = `Find 2 real MMA gyms in Toronto ON. Return ONLY valid JSON with no other text:
{ "leads": [{"business_name":"...","city":"Toronto","niche":"MMA gym","lead_score":7,"pain_signal":"...","phone":null,"website":null}] }`;

// Write prompt to a temp file (no spaces in path)
const tmpFile = "C:\\Temp\\cs-prompt.txt";
fs.mkdirSync("C:\\Temp", { recursive: true });
fs.writeFileSync(tmpFile, prompt, "utf8");

const claudePath = "C:\\Users\\thoma\\AppData\\Roaming\\npm\\claude.cmd";

// Build cmd string with short paths (no spaces issue)
const cmd = `${claudePath} --output-format text --dangerously-skip-permissions`;

const result = spawnSync(
  "cmd.exe",
  ["/c", `${cmd} < ${tmpFile}`],
  {
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 10 * 1024 * 1024,
    cwd: "C:\\Users\\thoma",
    windowsHide: true,
  }
);

fs.unlinkSync(tmpFile);

console.log("status:", result.status);
console.log("error:", result.error?.message);
console.log("STDOUT >>>\n", result.stdout?.slice(0, 1000));
console.log("STDERR >>>\n", result.stderr?.slice(0, 300));
