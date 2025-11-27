import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { hash, compare } from 'bcryptjs';

export const hashPassword = (password: string) => hash(password, 10);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      hash(password) {
        return hashPassword(password);
      },
      verify(data) {
        return compare(data.password, data.hash);
      },
    },
  },
});
