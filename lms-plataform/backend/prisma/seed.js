const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando Seed...");

  const passwordHash = await bcrypt.hash("123", 10);

  // 1. Criar Aluno (Como antes)
  await prisma.user.upsert({
    where: { email: "aluno@teste.com" },
    update: { password: passwordHash, role: "student" },
    create: {
      email: "aluno@teste.com",
      name: "João Aluno",
      password: passwordHash,
      role: "student",
    },
  });

  // 2. CRIAR O ADMINISTRADOR (NOVO)
  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: { password: passwordHash, role: "admin" },
    create: {
      email: "admin@teste.com",
      name: "Faizal",
      password: passwordHash,
      role: "admin", // <--- O segredo está aqui
    },
  });

  console.log("✅ Utilizadores criados: Aluno e Admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
