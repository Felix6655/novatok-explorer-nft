const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');

const cacheDir = path.join(process.cwd(), ".cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

// Generate usdcContracts.js
const usdcOutPath = path.join(cacheDir, "usdcContracts.js");
fs.writeFileSync(
  usdcOutPath,
  `const usdcContracts = {
  1: "",
  137: "",
  42161: "",
  10: "",
  8453: "",
  56: "",
};

export default usdcContracts;
`
);
console.log("Generated:", usdcOutPath);

// Run tsc synchronously to compile chains.ts
try {
  execSync('npx tsc --module ES6 --outDir .cache ./utils/chains.ts ./utils/usdcContracts.ts 2>/dev/null || true', {
    stdio: 'pipe'
  });
} catch (error) {
  // Ignore tsc errors, we'll handle missing files
}

// Patch .cache/chains.js import extension if it exists
const chainsPath = path.join(cacheDir, "chains.js");
if (fs.existsSync(chainsPath)) {
  let chainsCode = fs.readFileSync(chainsPath, "utf8");
  chainsCode = chainsCode.replace(
    /from\s+['"]\.\/usdcContracts['"]/g,
    "from './usdcContracts.js'"
  );
  fs.writeFileSync(chainsPath, chainsCode);
  console.log("Patched import in .cache/chains.js");
} else {
  // Create a minimal chains.js if it doesn't exist
  fs.writeFileSync(
    chainsPath,
    `export const DefaultChain = {
  id: 1,
  name: "Ethereum",
  routePrefix: "ethereum",
};
export default [DefaultChain];
`
  );
  console.log("Created minimal chains.js");
}
