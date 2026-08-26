const { Router } = require("express");
const roleController = require("../controllers/role.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// All Role endpoints require a valid access token
router.use(requireAuth);

router.post("/Create", roleController.createRole);
router.put("/Update/:id", roleController.updateRole);
router.delete("/Delete/:id", roleController.deleteRole);
router.get("/GetById/:id", roleController.getRoleById);
router.get("/GetAll", roleController.getAllRoles);
router.get("/GetAllPaginated", roleController.getAllRolesPaginated);

module.exports = router;
