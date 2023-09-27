import packageJson from './package.json';
import commander from 'commander';
import envinfo from 'envinfo';
import figlet from 'figlet';
import colors from 'colors';

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
      console.log(`    A custom ${'--scripts-version'.cyan} can be one of:`);
      console.log(`      - a specific npm version: ${'0.8.2'.green}`);
      console.log(`      - a specific npm tag: ${'@next'.green}`);
      console.log(
        `      - a custom fork published on npm: ${'code-gen-scripts'.green}`
      );
      console.log(
        `      - a local path relative to the current working directory: ${
          'file:../code-gen-scripts'.green
        }`
      );
      console.log();
      console.log(`    A custom ${'--template'.cyan} can be one of:`);
      console.log(
        `      - a custom template published on npm: ${
          'cra-template-typescript'.green
        }`
      );
      console.log();
      console.log(
        `    If you have any problems, do not hesitate to file an issue:`
      );
      console.log(
        `      ${
          'https://github.com/Joepolymath/express-code-gen/issues'.green
        }`
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
}
