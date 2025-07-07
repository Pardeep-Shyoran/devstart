#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CLI argument
let targetDir = process.argv[2];

// Prompt user if no folder name is given
async function promptProjectName() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const name = await new Promise((resolve) => {
		rl.question("❓ Enter a name for your project folder: ", (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});

	if (!name) {
		console.error("❌ Folder name cannot be empty.");
		process.exit(1);
	}

	return name;
}

// Main function
async function main() {
	if (!targetDir) {
		targetDir = await promptProjectName();
	}

	const targetPath = path.resolve(process.cwd(), targetDir);

	if (fs.existsSync(targetPath)) {
		console.error(`❌ Directory "${targetDir}" already exists.`);
		process.exit(1);
	}

	console.log(`🚀 Creating new project at: ${targetPath}`);
	fs.mkdirSync(targetPath, { recursive: true });

	// Copy base files
	const filesToCopy = [
		"index.html",
		"vite.config.js",
		"eslint.config.js",
		"README.md",
		".gitignore",
		"package.json",
	];

	filesToCopy.forEach((file) => {
		const src = path.join(__dirname, file);
		const dest = path.join(targetPath, destFile);
		fs.copyFileSync(src, dest);
	});

	// Copy folders
	["src", "public"].forEach((folder) => {
		const src = path.join(__dirname, folder);
		const dest = path.join(targetPath, folder);
		fs.cpSync(src, dest, { recursive: true });
	});

	console.log("✅ Files copied.");

	process.chdir(targetPath);
	execSync("git init", { stdio: "ignore" });

	console.log("📦 Installing dependencies...");
	execSync("npm install", { stdio: "inherit" });

	// Remove postinstall
	const pkgPath = path.join(targetPath, "package.json");
	const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
	if (pkg.scripts?.postinstall) {
		delete pkg.scripts.postinstall;
		fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
	}

	console.log(`\n🎉 Project setup complete!`);
	console.log(`👉 Next steps:`);
	console.log(`   cd ${targetDir}`);
	console.log(`   npm run dev`);
}

main();
