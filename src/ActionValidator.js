const actionSchema = require('./schemas/actionSchema');

class ActionValidator {
  static async validate(input) {
    const validatedConfig = await actionSchema.validateAsync(input, {
      abortEarly: false
    });
    return validatedConfig;
  }
}

module.exports = ActionValidator;
