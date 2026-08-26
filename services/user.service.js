const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");

/**
 * Create a new user (with password hashing).
 * @param {{ roleId: string, name?: string, email?: string, phoneNumber?: string, password?: string, isActive?: boolean }} data
 */
const createUser = async (data) => {
  const { roleId, name, email, phoneNumber, password, isActive } = data;
  
  if (!password) {
    throw new Error("Password is required");
  }
  
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      roleId,
      name,
      email,
      phoneNumber,
      passwordHash,
      isActive: isActive !== undefined ? isActive : true,
    },
    select: {
      id: true,
      roleId: true,
      name: true,
      email: true,
      phoneNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
};

/**
 * Update an existing user.
 * @param {string} id
 * @param {{ roleId?: string, name?: string, email?: string, phoneNumber?: string, password?: string, isActive?: boolean }} data
 */
const updateUser = async (id, data) => {
  const { roleId, name, email, phoneNumber, password, isActive } = data;
  const updateData = {};

  if (roleId) updateData.roleId = roleId;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      roleId: true,
      name: true,
      email: true,
      phoneNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
};

/**
 * Delete a user by ID.
 * @param {string} id
 */
const deleteUser = async (id) => {
  return prisma.user.delete({
    where: { id },
  });
};

/**
 * Get a user by ID.
 * @param {string} id
 */
const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      roleId: true,
      name: true,
      email: true,
      phoneNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
};

/**
 * Get all users.
 */
const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      roleId: true,
      name: true,
      email: true,
      phoneNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get users paginated and sorted.
 * @param {{ page?: number, limit?: number, sortBy?: string, sortOrder?: string }} params
 */
const getAllUsersPaginated = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) => {
  const allowedSortFields = ["name", "email", "createdAt", "updatedAt"];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { [orderField]: order },
      select: {
        id: true,
        roleId: true,
        name: true,
        email: true,
        phoneNumber: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    }),
    prisma.user.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
  getAllUsersPaginated,
};
