require("dotenv").config();
const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");

async function main() {
  console.log("Seeding started...");

  // 1. Ensure "admin" role exists
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrator with full system access",
    },
  });
  console.log(`Role "admin" ensured: ${adminRole.id}`);

  // 2. Read admin user credentials from environment
  const email = process.env.SEED_ADMIN_EMAIL || "admin@bookit.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";
  const name = process.env.SEED_ADMIN_NAME || "System Admin";

  // 3. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Admin user with email ${email} already exists. Skipping creation.`);
  } else {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        roleId: adminRole.id,
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log(`Admin user created successfully: ${newAdmin.email} (${newAdmin.id})`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
