import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrateur";

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ L'utilisateur avec l'email ${email} existe déjà.`);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        role: "ADMIN",
        emailVerified: true,
      },
    });

    // Créer le compte avec le mot de passe
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });

    console.log("✅ Compte admin créé avec succès !");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log("\n⚠️  N'oubliez pas de changer le mot de passe après la première connexion !");
  } catch (error) {
    console.error("❌ Erreur lors de la création du compte admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

