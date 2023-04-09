const configSchema = require('./schemas/configSchema');
const actionSchema = require('./schemas/actionSchema');

class ConfigValidator {
  static get schema() {
    return configSchema;
  }

  static async validate(input) {
    const validatedConfig = await this.schema.validateAsync(input, {
      abortEarly: false
    });
    return validatedConfig;
  }
}

class ActionValidator {
  static get #schema() {
    return actionSchema;
  }

  static async validate(input) {
    const validatedConfig = await this.#schema.validateAsync(input, {
      abortEarly: false
    });
    return validatedConfig;
  }
}

module.exports = { ConfigValidator, ActionValidator };
