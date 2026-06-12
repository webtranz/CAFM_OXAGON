import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultAdmins = [
  {
    name: "System Administrator",
    email: "admin@cafm.local",
    password: "Admin@12345",
  },
];

async function ensureAdmin({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "Admin",
      department: "Administration",
      passwordHash,
      active: true,
    },
    create: {
      name,
      email,
      role: "Admin",
      department: "Administration",
      passwordHash,
      active: true,
    },
  });
  console.log(`Ensured admin login: ${email}`);
}

async function main() {
  for (const admin of defaultAdmins) {
    await ensureAdmin(admin);
  }
}

main()
  .catch((error) => {
    console.error("Admin login check failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
