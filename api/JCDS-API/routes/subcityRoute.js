const express = require('express');
const SubcityController = require('../controllers/subcityController');
const cityValidator = require('../validators/cityValidator');

const router = express.Router();

// Subcity routes
router.post('/',cityValidator.validateSubcity, SubcityController.createSubcity); 
router.get("/", SubcityController.getSubcities);
router.get("/:subcity_id", SubcityController.getSubcityById);
router.get('/:city_id', SubcityController.getSubcitiesByCity); 
router.put('/:subcity_id',cityValidator.validateSubcity, SubcityController.updateSubcity); 
router.delete('/:subcity_id', SubcityController.deleteSubcity); 

module.exports = router;
