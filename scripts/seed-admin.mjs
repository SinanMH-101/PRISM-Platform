import prismaClientPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const { PrismaClient } = prismaClientPackage;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@prism.local" },
    update: {
      username: "Admin",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await hashPassword("Admin123!"),
    },
    create: {
      username: "Admin",
      name: "Admin",
      email: "admin@prism.local",
      role: "ADMIN",
      passwordHash: await hashPassword("Admin123!"),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded admin user: Admin");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
