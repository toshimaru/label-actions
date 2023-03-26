const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');

const { App } = require('./App');
const { configSchema, actionSchema } = require('./schema');

async function run() {
  try {
    const config = getConfig();
    const client = github.getOctokit(config['github-token']);

    const actions = await getActionConfig(client, config['config-path']);

    await new App(config, client, actions).performActions();
  } catch (err) {
    core.setFailed(err);
  }
}

function getConfig() {
  const input = Object.fromEntries(
    Object.keys(configSchema.describe().keys).map(item => [
      item,
      core.getInput(item)
    ])
  );

  const { error, value } = configSchema.validate(input, { abortEarly: false });
  if (error) {
    throw error;
  }

  return value;
}

async function getActionConfig(client, configPath) {
  let configData;
  try {
    ({
      data: { content: configData }
    } = await client.repos.getContent({
      ...github.context.repo,
      path: configPath
    }));
  } catch (err) {
    if (err.status === 404) {
      throw new Error(`Missing configuration file (${configPath})`);
    } else {
      throw err;
    }
  }

  const input = yaml.load(Buffer.from(configData, 'base64').toString());
  if (!input) {
    throw new Error(`Empty configuration file (${configPath})`);
  }

  const { error, value } = actionSchema.validate(input, { abortEarly: false });
  if (error) {
    throw error;
  }

  return value;
}

run();
