import packageJson from './package.json';
import globalPackageJson from '../../package.json';
import commander from 'commander';
import envinfo from 'envinfo';
import figlet from 'figlet';
import https from 'https';
import colors from 'colors';
import { execSync, spawn } from 'child_process';
import semver from 'semver';
import path from 'path';
import validateProjectName from 'validate-npm-package-name';
import fs from 'fs';
import os from 'os';

function isUsingYarn() {
  return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}

function isUsingPnpm() {
  return (process.env.npm_config_user_agent || '').indexOf('pnpm') === 0;
}

let projectName;

export function init() {
  console.log(figlet.textSync('Express Code Gen'));
  const program: any = new commander.Command(packageJson.name)
    .version(packageJson.version) // allows the --version flag to return the current version in the package.json
    .arguments('<project-directory>')
    .usage(`${'<project-directory>'} [options]`)
    .action((name) => {
      projectName = name;
    })
    .option('--verbose', 'print additional logs')
    .option('--info', 'print environment debug info')
    .option(
      '--scripts-version <alternative-package>',
      'use a non-standard version of gen-scripts'
    )
    .option(
      '--template <path-to-template>',
      'specify a template for the created project'
    )
    .option('--use-pnp')
    .allowUnknownOption()
    .on('--help', () => {
      console.log(`    Only ${'<project-directory>'} is required.`);
      console.log();
      console.log(`    A custom ${'--scripts-version'} can be one of:`);
      console.log(`      - a specific npm version: ${'0.8.2'}`);
      console.log(`      - a specific npm tag: ${'@next'}`);
      console.log(
        `      - a custom fork published on npm: ${'code-gen-scripts'}`
      );
      console.log(
        `      - a local path relative to the current working directory: ${'file:../code-gen-scripts'}`
      );
      console.log();
      console.log(`    A custom ${'--template'} can be one of:`);
      console.log(
        `      - a custom template published on npm: ${'code-gen-template-typescript'}`
      );
      console.log();
      console.log(
        `    If you have any problems, do not hesitate to file an issue:`
      );
      console.log(
        `      ${'https://github.com/Joepolymath/express-code-gen/issues'}`
      );
      console.log();
    })
    .parse(process.argv);

  if (program.info) {
    console.log('\nEnvironment Info:'.green);
    console.log(
      `\n  current version of ${packageJson.name}: ${packageJson.version}`
    );
    console.log(`  running from ${__dirname}`);
    return envinfo
      .run(
        {
          System: ['OS', 'CPU'],
          Binaries: ['Node', 'npm', 'Yarn'],
          Browsers: [
            'Chrome',
            'Edge',
            'Internet Explorer',
            'Firefox',
            'Safari',
          ],
        },
        {
          duplicates: true,
          showNotFound: true,
        }
      )
      .then(console.log);
  }

  if (typeof projectName === 'undefined') {
    console.error('Please specify the project directory:');
    console.log(`  ${program.name()} ${'<project-directory>'}`);
    console.log();
    console.log('For example:');
    console.log(`  ${program.name()} ${'my-code-gen'}`);
    console.log();
    console.log(`Run ${`${program.name()} --help`} to see all options.`);
    process.exit(1);
  }

  checkForLatestVersion()
    .catch(() => {
      try {
        return execSync('npm view express-code-gen version').toString().trim();
      } catch (e) {
        return null;
      }
    })
    .then((latest) => {
      if (latest && semver.lt(packageJson.version, latest)) {
        console.log();
        console.error(
          `You are running \`express-code-gen\` ${packageJson.version}, which is behind the latest release (${latest}).\n\n` +
            'We recommend always using the latest version of express-code-gen if possible.'
        );
        console.log();
        console.log();
      } else {
        const useYarn = isUsingYarn();
        createApp(
          projectName,
          program.verbose,
          program.scriptsVersion,
          program.template,
          useYarn,
          program.usePnp
        );
      }
    });
}

function createApp(name, verbose, version, template, useYarn, usePnp) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkAppName(appName);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }
  console.log();

  console.log(`Creating a new Express app in ${root}.`);
  console.log();

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const originalDirectory = process.cwd();
  process.chdir(root);
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }
}

function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput: null | string = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    let spawnOutput = spawn('npm', ['config', 'list']);
    spawnOutput.stdout.on('data', (data) => {
      childOutput = data.join('');
    });
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  childOutput = (childOutput as string).toString();
  const lines = childOutput.split('\n');
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = '; cwd = ';
  const line = lines.find((line) => line.startsWith(prefix));
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    `Could not start an npm process in the right directory.\n\n` +
      `The current directory is: ${cwd}\n` +
      `However, a newly started npm process runs in: ${npmCWD}\n\n` +
      `This is probably caused by a misconfigured system terminal shell.`
  );
  if (process.platform === 'win32') {
    console.error(
      `On Windows, this can usually be fixed by running:\n\n` +
        `  ${'reg'} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${'reg'} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        `Try to run the above two lines in the terminal.\n` +
        `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
    );
  }
  return false;
}

function checkForLatestVersion() {
  return new Promise((resolve, reject) => {
    https
      .get(
        'https://registry.npmjs.org/-/package/express-code-gen/dist-tags',
        (res) => {
          if (res.statusCode === 200) {
            let body = '';
            res.on('data', (data) => (body += data));
            res.on('end', () => {
              resolve(JSON.parse(body).latest);
            });
          } else {
            reject();
          }
        }
      )
      .on('error', () => {
        reject();
      });
  });
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Cannot create a project named ${`"${appName}"`} because of npm naming restrictions:\n`
    );
    [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ].forEach((error) => {
      console.error(`  * ${error}`);
    });
    console.error('\nPlease choose a different project name.');
    process.exit(1);
  }

  // Check against dependencies
  const dependenciesObj = globalPackageJson.dependencies;
  const dependencies = Object.keys(dependenciesObj).sort();
  if (dependencies.includes(appName)) {
    console.error(
      `Cannot create a project named ${`"${appName}"`} because a dependency with the same name exists.\n` +
        `Due to the way npm works, the following names are not allowed:\n\n` +
        dependencies.map((depName) => `  ${depName}`).join('\n') +
        '\n\nPlease choose a different project name.'
    );
    process.exit(1);
  }
}

// If project only contains files generated by GH, it’s safe.
// Also, if project contains remnant error logs from a previous
// installation, lets remove them now.
function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'docs',
    'LICENSE',
    'README.md',
    'mkdocs.yml',
    'Thumbs.db',
  ];
  // These files should be allowed to remain on a failed install, but then
  // silently removed during the next create.
  const errorLogFilePatterns = [
    'npm-debug.log',
    'yarn-error.log',
    'yarn-debug.log',
  ];
  const isErrorLog = (file) => {
    return errorLogFilePatterns.some((pattern) => file.startsWith(pattern));
  };

  const conflicts = fs
    .readdirSync(root)
    .filter((file) => !validFiles.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    .filter((file) => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    .filter((file) => !isErrorLog(file));

  if (conflicts.length > 0) {
    console.log(`The directory ${name} contains files that could conflict:`);
    console.log();
    for (const file of conflicts) {
      try {
        const stats = fs.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          console.log(`  ${`${file}/`}`);
        } else {
          console.log(`  ${file}`);
        }
      } catch (e) {
        console.log(`  ${file}`);
      }
    }
    console.log();
    console.log(
      'Either try using a new directory name, or remove the files listed above.'
    );

    return false;
  }

  // Remove any log files from a previous installation.
  fs.readdirSync(root).forEach((file) => {
    if (isErrorLog(file)) {
      // TODO: Find a way to remove the files.
      fs.rmSync(path.join(root, file));
    }
  });
  return true;
}
