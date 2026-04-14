import { execSync } from "child_process";

console.log("Searching for all deleted files in server/Faces...");

try {
  // Get list of all files that were ever deleted from Faces
  const deletedFiles = execSync('git log --pretty=format: --name-status --diff-filter=D Faces/')
    .toString()
    .split('\n')
    .filter(line => line.startsWith('D'))
    .map(line => line.substring(1).trim());

  if (deletedFiles.length === 0) {
    console.log("No deleted files found in Git history for Faces/ directory.");
  } else {
    console.log(`Found ${deletedFiles.length} deleted files. Attempting recovery...`);
    
    for (const file of deletedFiles) {
      try {
        // Find the last commit where the file existed
        const lastCommit = execSync(`git rev-list -n 1 HEAD -- "${file}"`).toString().trim();
        if (lastCommit) {
           execSync(`git checkout ${lastCommit} -- "${file}"`);
           console.log(`✅ Recovered: ${file}`);
        }
      } catch (err) {
        console.warn(`❌ Failed to recover: ${file}`);
      }
    }
  }
} catch (error) {
  console.error("Git error:", error.message);
}
