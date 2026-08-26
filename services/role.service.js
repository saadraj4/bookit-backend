const prisma = require("../lib/prisma");

/**
 * Create a new role.
 * @param {{ name: string, description?: string }} data
 */
const createRole = async (data) => {
  const { name, description } = data;
  return prisma.role.create({
    data: { name, description },
  });
};

/**
 * Update an existing role by ID.
 * @param {string} id
 * @param {{ name?: string, description?: string }} data
 */
const updateRole = async (id, data) => {
  const { name, description } = data;
  return prisma.role.update({
    where: { id },
    data: { name, description },
  });
};

/**
 * Delete a role by ID.
 * @param {string} id
 */
const deleteRole = async (id) => {
  return prisma.role.delete({ where: { id } });
};

/**
 * Get a single role by ID.
 * @param {string} id
 */
const getRoleById = async (id) => {
  return prisma.role.findUnique({ where: { id } });
};

/**
 * Get all roles (no pagination).
 */
const getAllRoles = async () => {
  return prisma.role.findMany({ orderBy: { createdAt: "asc" } });
};

/**
 * Get roles with pagination and sorting.
 * @param {{ page?: number, limit?: number, sortBy?: string, sortOrder?: string }} params
 */
const getAllRolesPaginated = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "asc",
} = {}) => {
  const allowedSortFields = ["name", "createdAt"];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "desc" ? "desc" : "asc";

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.role.findMany({
      skip,
      take: limit,
      orderBy: { [orderField]: order },
    }),
    prisma.role.count(),
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
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getAllRoles,
  getAllRolesPaginated,
};
