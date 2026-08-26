const userService = require("../services/user.service");
const { success, error } = require("../lib/response");

const createUser = async (req, res) => {
  try {
    const { roleId, name, email, phoneNumber, password, isActive } = req.body;
    if (!roleId) return error(res, "roleId is required", 400);
    if (!email && !phoneNumber) return error(res, "Either email or phoneNumber is required", 400);
    if (!password) return error(res, "password is required", 400);

    const user = await userService.createUser({ roleId, name, email, phoneNumber, password, isActive });
    return success(res, user, "User created successfully", 201);
  } catch (err) {
    if (err.code === "P2002") {
      return error(res, "A user with this email or phone number already exists", 409);
    }
    return error(res, err.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, name, email, phoneNumber, password, isActive } = req.body;

    const user = await userService.updateUser(id, { roleId, name, email, phoneNumber, password, isActive });
    return success(res, user, "User updated successfully");
  } catch (err) {
    if (err.code === "P2025") return error(res, "User not found", 404);
    if (err.code === "P2002") return error(res, "A user with this email or phone number already exists", 409);
    return error(res, err.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    return success(res, null, "User deleted successfully");
  } catch (err) {
    if (err.code === "P2025") return error(res, "User not found", 404);
    return error(res, err.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) return error(res, "User not found", 404);
    return success(res, user);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return success(res, users);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAllUsersPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const result = await userService.getAllUsersPaginated({ page, limit, sortBy, sortOrder });
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
  getAllUsersPaginated,
};
