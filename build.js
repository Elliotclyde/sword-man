import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const srcDir = __dirname;

// Files and directories to include
const filesToCopy = [
  "index.html",
  "about.html",
  "game.js",
  "config.js",
  "GridOverlay.js",
  "MobileControls.js",
  "styles.css",
];

const dirsToCopy = ["assets", "scenes", "utils"];

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Copy individual files
filesToCopy.forEach((file) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file}`);
  }
});

// Copy directories recursively
dirsToCopy.forEach((dir) => {
  const srcPath = path.join(srcDir, dir);
  const destPath = path.join(distDir, dir);
  if (fs.existsSync(srcPath)) {
    copyDir(srcPath, destPath);
    console.log(`Copied directory ${dir}`);
  }
});

// Copy Phaser library from node_modules
const phaserSrc = path.join(
  srcDir,
  "node_modules",
  "phaser",
  "dist",
  "phaser.js",
);
const phaserDest = path.join(distDir, "phaser.js");
if (fs.existsSync(phaserSrc)) {
  fs.mkdirSync(path.join(distDir, "lib"), { recursive: true });
  fs.copyFileSync(phaserSrc, path.join(distDir, "lib", "phaser.js"));
  console.log("Copied Phaser library");
} else {
  console.warn("Warning: Phaser library not found in node_modules");
}

console.log("\nBuild complete! Files ready in dist/ folder.");

/**
 * Recursively copy a directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach((entry) => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
