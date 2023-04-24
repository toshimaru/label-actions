const core = require('@actions/core');

const App = require('./App');
const ConfigValidator = require('./validators/ConfigValidator');

async function run() {
  try {
    const config = await getConfig();
    await new App(config).performActions();
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

run();
