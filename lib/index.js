#! /usr/bin/env node

const shell = require("shelljs");

const expressGen = (packageManager) => {
  shell.exec("git clone git@github.com:Joepolymath/baseNodeServer.git .");

  shell.exec("git init");

  shell.exec("git remote remove origin");

  if (packageManager === "npm") {
    shell.exec("npm install");
  } else if (packageManager === "yarn") {
    shell.exec("yarn install");
  } else {
    console.error("Invalid package manager. Please use 'npm' or 'yarn'.");
    process.exit(1);
  }

  shell.echo("Happy Coding 😃 from Jonathan and joshua");
};

module.exports = expressGen;
