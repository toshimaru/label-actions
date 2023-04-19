const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');

const App = require('./App');
const ConfigValidator = require('./validators/ConfigValidator');
const ActionValidator = require('./validators/ActionValidator');

async function run() {
  try {
    const config = await getConfig();
    const client = github.getOctokit(config['github-token']);
    const actions = await getActionConfig(client, config['config-path']);

    await new App(config, client, actions).performActions();
  } catch (err) {
    core.setFailed(err);
  }
}

async function getConfig() {
  const input = Object.fromEntries(
    ConfigValidator.schemaKeys.map(key => [key, core.getInput(key)])
  );
  return await ConfigValidator.validate(input);
}

async function getActionConfig(client, configPath) {
  let configData;
  try {
    ({
      data: { content: configData }
    } = await client.rest.repos.getContent({
      ...github.context.repo,
      path: configPath
    }));
  } catch (err) {
    throw err.status === 404
      ? new Error(`Missing configuration file (${configPath})`)
      : err;
  }

  const input = yaml.load(Buffer.from(configData, 'base64').toString());
  if (!input) {
    throw new Error(`Empty configuration file (${configPath})`);
  }
  return await ActionValidator.validate(input);
}

run();
