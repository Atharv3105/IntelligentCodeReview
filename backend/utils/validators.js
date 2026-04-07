const Joi = require('joi');

const registerSchema = Joi.object({
  name:     Joi.string().min(1).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),

  // College identity fields — all optional (null for public users)
  prn:      Joi.string().max(20).optional().allow("", null),
  division: Joi.string().max(5).optional().allow("", null),
  year:     Joi.string().valid("FY", "SY", "TY", "Final Year", "").optional().allow(null),
  branch:   Joi.string().max(30).optional().allow("", null)
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};
