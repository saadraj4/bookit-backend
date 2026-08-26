const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// Protect all user routes
router.use(requireAuth);

router.post("/Create", userController.createUser);
router.put("/Update/:id", userController.updateUser);
router.delete("/Delete/:id", userController.deleteUser);
router.get("/GetById/:id", userController.getUserById);
router.get("/GetAll", userController.getAllUsers);
router.get("/GetAllPaginated", userController.getAllUsersPaginated);

module.exports = router;
