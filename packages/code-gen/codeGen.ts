import packageJson from './package.json';
import commander from 'commander';
import envinfo from 'envinfo';
import figlet from 'figlet';
import https from 'https';
import colors from 'colors';
import { execSync } from 'child_process';
import semver from 'semver';

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

function createApp(name, verbose, version, template, useYarn, usePnp) {}

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
