const Joi = require('joi');

const actions = {
  close: Joi.boolean(),

  reopen: Joi.boolean(),

  lock: Joi.boolean(),

  unlock: Joi.boolean(),

  'lock-reason': Joi.alternatives().try(
    Joi.boolean().only(false),
    Joi.string().trim().valid('resolved', 'off-topic', 'too heated', 'spam', '')
  ),

  reviewers: Joi.array(),

  'number-of-reviewers': Joi.number(),

  comment: Joi.alternatives().try(
    Joi.boolean().only(false),
    Joi.string().trim().valid(''),
    Joi.array().items(Joi.string().trim().max(65536)).min(1).max(10).single()
  ),

  label: Joi.alternatives().try(
    Joi.boolean().only(false),
    Joi.string().trim().valid(''),
    Joi.array()
      .items(Joi.string().trim().max(50))
      .min(1)
      .max(30)
      .unique()
      .single()
  ),

  unlabel: Joi.alternatives().try(
    Joi.boolean().only(false),
    Joi.string().trim().valid(''),
    Joi.array()
      .items(Joi.string().trim().max(50))
      .min(1)
      .max(30)
      .unique()
      .single()
  )
};

const actionSchema = Joi.object()
  .pattern(
    Joi.string().trim().max(51),
    Joi.object().keys({
      close: actions.close.default(false),
      reopen: actions.reopen.default(false),
      lock: actions.lock.default(false),
      unlock: actions.unlock.default(false),
      'lock-reason': actions['lock-reason'].default(''),
      reviewers: actions.reviewers.default([]),
      'number-of-reviewers': actions['number-of-reviewers'].default(1),
      comment: actions.comment.default(''),
      label: actions.label.default(''),
      unlabel: actions.unlabel.default(''),

      issues: Joi.object().keys(actions),
      prs: Joi.object().keys(actions)
    })
  )
  .min(1)
  .max(200);

module.exports = actionSchema;
