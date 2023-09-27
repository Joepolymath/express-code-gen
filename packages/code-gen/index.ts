#!/usr/bin/env node

import { init } from './codeGen';

const currentNodeVersion = process.versions.node;
const versionArray = currentNodeVersion.split('.');
const major = Number(versionArray[0]);

if (major < 14) {
  console.error(
    'You are running Node ' +
      currentNodeVersion +
      '.\n' +
      'Express Code Gen requires Node 14 or higher. \n' +
      'Please update your version of Node.'
  );
  process.exit(1);
}

init();
