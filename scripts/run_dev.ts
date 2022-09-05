import * as dotenv from "dotenv";
import path from "path";
import {exec} from "child_process";
import chalk from "chalk";

const cwd = process.cwd();
const env_file = path.resolve(cwd, ".env");

const path_db = path.resolve(cwd, "memdb");
const path_bot = path.resolve(cwd, "bot");
const path_legacy = path.resolve(cwd, "bot_legacy");

const labeledStdout = (label: string, color: string) => {
   const colored = chalk.hex(color);
   const prefix = colored(label + " | ");

   return (data: string) => {
      process.stdout.write(prefix + data)
   }
}

interface RunOptions {
   cwd: string,
   command: string,
   label: string,
   color: string
}

function main() {
   console.log("Using config", env_file);

   const envContent = dotenv.config({path: env_file});
   if (envContent.error) {
      throw new Error(`Failed parsing env file at '${env_file}': ${envContent.error}`);
   }

   const env = {
      ...envContent.parsed,
      FORCE_COLOR: "1"
   }
   
   const run = ({cwd, command, label, color}: RunOptions) => {
      const child = exec(command, {cwd, env});
      child.stdout?.on("data", labeledStdout(label, color));
   }

   run({
      cwd: path_bot,
      command: "npm run dev",
      label: "bot",
      color: "#3ACADF"
   });

   run({
      cwd: path_legacy,
      command: "npm start",
      label: "legacy",
      color: "#8A64D6" 
   });
}

try {
   main()
} catch (e) {
   console.error(e);
}