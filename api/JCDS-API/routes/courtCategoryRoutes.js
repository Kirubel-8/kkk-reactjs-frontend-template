const router = require("express").Router();
const controller = require("../controllers/courtCategoryController");


// COURT CATEGORY ROUTES
router.post("/category", controller.createCourtCategory);
router.get("/category", controller.getCourtCategories);
router.get("/category/:id", controller.getCourtCategoryById);
router.put("/category/:id", controller.updateCourtCategory);
router.delete("/category/:id", controller.deleteCourtCategory);


// COURT OFFICE ROUTES
router.post("/office", controller.createCourtOffice);
router.get("/office", controller.getCourtOffices);
router.get("/office/:id", controller.getCourtOfficeById);
router.get("/office/by-category/:id", controller.getOfficesByCategory);
router.put("/office/:id", controller.updateCourtOffice);
router.delete("/office/:id", controller.deleteCourtOffice);

module.exports = router;
