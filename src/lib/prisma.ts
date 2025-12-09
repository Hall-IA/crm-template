import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { Pool } from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;

// Créer un pool de connexions PostgreSQL pour une meilleure gestion
const pool = new Pool({
  connectionString,
  max: 10, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 10000, // Timeout de connexion de 10s
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Gestion propre de la fermeture lors de l'arrêt de l'application
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
}

export { prisma };
