#! /usr/bin/env node

const shell = require("shelljs");

const expressGen = () => {
  shell.exec("git clone git@github.com:Joepolymath/baseNodeServer.git .");

  shell.exec("git init");

  shell.exec("git remote remove origin");

  shell.exec("yarn install");

  shell.echo("Happy Coding 😃");
};

module.exports = expressGen;
