const express = require('express');
const CityController = require('../controllers/cityController');
const cityValidator = require('../validators/cityValidator');

const router = express.Router();

// City routes
router.post('/',cityValidator.validateCity, CityController.createCity); 
router.get('/', CityController.getCities); 
router.get('/:id', CityController.getCityById); 
router.put('/:id',cityValidator.validateCity, CityController.updateCity); 
router.delete('/:id', CityController.deleteCity); 

module.exports = router;
