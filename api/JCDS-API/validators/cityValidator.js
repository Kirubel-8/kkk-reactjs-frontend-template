const Joi = require("joi");
const { City, Subcity } = require("../models");

const citySchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "City name is required",
  }),
});

const subcitySchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Subcity name is required",
  }),
  city_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required()
    .messages({
      "string.empty": "City ID is required",
      "string.guid": "City ID must be a valid UUID",
    }),
});

const validateCity = (req, res, next) => {
  const { error } = citySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
const validateSubcity = async (req, res, next) => {
  const { error } = subcitySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const city = await City.findByPk(req.body.city_id);
    if (!city) {
      return res.status(404).json({ error: "City does not exist" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Error validating city ID" });
  }

  next();
};

module.exports = {
  validateCity,
  validateSubcity,
};
