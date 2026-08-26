require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const roleRoutes = require("./routes/role.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api/Role", roleRoutes);
app.use("/api/User", userRoutes);
app.use("/api/Auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Bookit API is running" });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected", error: error.message });
  }
});

async function startServer() {
  try {
    // Verify database connection using Prisma Client
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected via Prisma Client");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Database connection closed gracefully");
  process.exit(0);
});

startServer();
