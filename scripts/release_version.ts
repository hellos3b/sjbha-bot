//
// Upticks the release version
//

import path from "path";
import fs from "fs";
import semver from "semver";
import child_process from "child_process";

const cwd = process.cwd();
const package_root = path.resolve(cwd, "package.json");
const package_bot = path.resolve(cwd, "bot", "package.json");

const release = process.argv[2];
const release_types = ["major", "minor", "patch"];

const currentVersion = (): string => {
   const root_package = fs.readFileSync(package_root, "utf8");
   const package_json = JSON.parse(root_package);
   const version = package_json["version"];

   if (typeof version !== "string")
      throw new Error(`Unable to parse version from root package; Reading ${root_package}, version ${version}`);

   return version;
}

const setPackageVersion = (packagePath: string, version: string) => {
   const root_package = fs.readFileSync(package_root, "utf8");
   const package_json = JSON.parse(root_package);
   const copy = {...package_json};
   copy["version"] = version;
   fs.writeFileSync(packagePath, JSON.stringify(copy, null, 2));
}

function main() {
   if (!release || !release_types.includes(release)) {
      throw new Error(`Invalid release version '${release}'. Please use full command: 'pnpm uptick <${release_types}>'`);
   }

   const version = currentVersion();
   const nextVersion = semver.inc(version, release);

   if (!nextVersion) {
      throw new Error(`Failed to uptick release version`);
   }

   console.log(`Upticking root package version from ${version} to ${nextVersion}`);
   setPackageVersion(package_root, nextVersion);

   console.log(`Upticking version in bot`);
   setPackageVersion(package_bot, nextVersion);

   console.log(`Pushing changes to github ${nextVersion}`);
   child_process.execSync(`git tag -a v${nextVersion} -m "v${nextVersion}"`);
   child_process.execSync(`git add .`);
   child_process.execSync(`git commit -m "v${nextVersion}"`);
   child_process.execSync(`git push origin master tag v${nextVersion}`);

   console.log(`Finished publishing release, head over to the releases tab on github now to publish the changelog!`);
}

try {
   main()
} catch (err) {
   console.error("Unable to uptick version: ", err)
}