const actionSchema = require('./schemas/actionSchema');

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

module.exports = ActionValidator;
