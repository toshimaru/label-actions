const Joi = require('joi');

const extendedJoi = Joi.extend({
  type: 'processOnly',
  base: Joi.string(),
  coerce: {
    from: 'string',
    method(value) {
      value = value.trim();
      if (['issues', 'prs'].includes(value)) {
        value = value.slice(0, -1);
      }

      return { value };
    }
  }
});

const configSchema = Joi.object({
  'github-token': Joi.string().trim().max(100),

  'config-path': Joi.string()
    .trim()
    .max(200)
    .default('.github/label-actions.yml'),

  'process-only': extendedJoi.processOnly().valid('issue', 'pr', '').default('')
});

module.exports = configSchema;
