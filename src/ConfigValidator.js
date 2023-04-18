const configSchema = require('./schemas/configSchema');

class ConfigValidator {
  static get schemaKeys() {
    return Object.keys(configSchema.describe().keys);
  }

  static async validate(input) {
    const validatedConfig = await configSchema.validateAsync(input, {
      abortEarly: false
    });
    return validatedConfig;
  }
}

module.exports = ConfigValidator;
