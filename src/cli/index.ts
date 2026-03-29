#!/usr/bin/env node

import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";

const program = new Command();

program
  .name("gsap-slides")
  .description("GSAP-powered slide deck framework using Markdown")
  .version("0.1.0");

registerInitCommand(program);

program.parse();
