const configSchema = require('./schemas/configSchema');

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

module.exports = ConfigValidator;
