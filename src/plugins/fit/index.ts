import {command} from "@app/bastion";

import {profile} from "./src/commands/profile";
import {adminAdd} from "./src/admin/add";

const fit$ = command("fit");

fit$
  .subcommand("profile")
  .subscribe(profile);


// todo: restrict admin commands
const admin$ = fit$;

admin$
  .subcommand("add")
  .subscribe(adminAdd)