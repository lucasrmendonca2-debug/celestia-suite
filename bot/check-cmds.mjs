import { Collection } from "discord.js";
import { loadCommands } from "./dist/bot/handlers/commands.js";
const fake = { commands: new Collection() };
const cmds = await loadCommands(fake);
const body = cmds.map(c => c.data.toJSON());
// Find any subcommand with required-after-optional
for (const c of body) {
  const checkOpts = (opts, path) => {
    let sawOptional = false;
    for (const [i, o] of (opts ?? []).entries()) {
      if (o.type === 1 || o.type === 2) { // SUB_COMMAND / SUB_GROUP
        checkOpts(o.options, `${path}/${o.name}`);
      } else {
        if (o.required) {
          if (sawOptional) console.log("BAD:", path, "opt", i, o.name, "required after optional");
        } else sawOptional = true;
      }
    }
  };
  checkOpts(c.options, c.name);
}
