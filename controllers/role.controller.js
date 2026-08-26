const roleService = require("../services/role.service");
const { success, error } = require("../lib/response");

const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, "Role name is required", 400);

    const role = await roleService.createRole({ name, description });
    return success(res, role, "Role created successfully", 201);
  } catch (err) {
    if (err.code === "P2002") {
      return error(res, "A role with this name already exists", 409);
    }
    return error(res, err.message);
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await roleService.updateRole(id, { name, description });
    return success(res, role, "Role updated successfully");
  } catch (err) {
    if (err.code === "P2025") return error(res, "Role not found", 404);
    if (err.code === "P2002") return error(res, "A role with this name already exists", 409);
    return error(res, err.message);
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id);
    return success(res, null, "Role deleted successfully");
  } catch (err) {
    if (err.code === "P2025") return error(res, "Role not found", 404);
    return error(res, err.message);
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    if (!role) return error(res, "Role not found", 404);
    return success(res, role);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    return success(res, roles);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAllRolesPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = "createdAt", sortOrder = "asc" } = req.query;

    const result = await roleService.getAllRolesPaginated({ page, limit, sortBy, sortOrder });
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getAllRoles,
  getAllRolesPaginated,
};
