import fs from "fs";
import path from "path";

const srcDir = "./src";

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (stat.isFile() && (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts") || fullPath.endsWith(".css"))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walk(srcDir);
console.log(`Found ${files.length} files to check.`);

for (const file of files) {
  const buf = fs.readFileSync(file);
  let modified = false;
  const cleanBytes = [];

  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    // Remove carriage returns (\r = 13) and null bytes (0)
    if (b === 13 || b === 0) {
      modified = true;
      continue;
    }
    // Remove weird control characters below 32, except tab (9) and newline (10)
    if (b < 32 && b !== 9 && b !== 10) {
      modified = true;
      continue;
    }
    cleanBytes.push(b);
  }

  if (modified) {
    console.log(`Scrubbed control characters/carriage returns from: ${file}`);
    fs.writeFileSync(file, Buffer.from(cleanBytes));
  }
}

console.log("Scrubbing complete!");
