import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const poolConfig = {
  connectionString: process.env.DATABASE_URL || "",
  max: 5,
  idleTimeoutMillis: 10000,
};

const prisma = new PrismaClient({
  adapter: new PrismaPg(poolConfig),
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
