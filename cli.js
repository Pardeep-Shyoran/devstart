#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Resolve current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prompt user for project name if not provided
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

// Validate .gitignore contents
function validateGitignore(srcPath) {
	const gitignorePath = path.join(srcPath, ".gitignore");
	if (!fs.existsSync(gitignorePath)) {
		console.warn("⚠️  .gitignore file is missing.");
		return;
	}

	const content = fs.readFileSync(gitignorePath, "utf-8").trim();
	if (!content) {
		console.warn("⚠️  .gitignore file is empty.");
	}
}

// Main logic
async function main() {
	let targetDir = process.argv[2] || (await promptProjectName());
	const targetPath = path.resolve(process.cwd(), targetDir);

	if (fs.existsSync(targetPath)) {
		console.error(`❌ Directory "${targetDir}" already exists.`);
		process.exit(1);
	}

	console.log(`🚀 Creating new project at: ${targetPath}`);
	fs.mkdirSync(targetPath, { recursive: true });

	// Files and folders to copy
	const filesToCopy = [
		"index.html",
		"vite.config.js",
		"eslint.config.js",
		"README.md",
		".gitignore",
		"package.json",
	];

	const foldersToCopy = ["src", "public"];

	// Copy files
	for (const file of filesToCopy) {
		const src = path.join(__dirname, file);
		const dest = path.join(targetPath, file);
		if (fs.existsSync(src)) {
			fs.copyFileSync(src, dest);
		} else {
			console.warn(`⚠️  Missing file: ${file}`);
		}
	}

	// Check .gitignore contents
	validateGitignore(__dirname);

	// Copy directories
	for (const folder of foldersToCopy) {
		const src = path.join(__dirname, folder);
		const dest = path.join(targetPath, folder);
		if (fs.existsSync(src)) {
			fs.cpSync(src, dest, { recursive: true });
		} else {
			console.warn(`⚠️  Missing folder: ${folder}`);
		}
	}

	console.log("✅ Files copied.");

	// Initialize Git and install dependencies
	process.chdir(targetPath);
	execSync("git init", { stdio: "ignore" });

	console.log("📦 Installing dependencies...");
	execSync("npm install", { stdio: "inherit" });

	// Remove postinstall if exists
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