import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error-handler.js';
import type { User } from '../../generated/prisma/client.js';
import type { GoogleProfile } from './google.js';

const BCRYPT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl };
}

/**
 * Google login. Matches on google_id first, then on email so someone who signed up with a
 * password and later uses Google with the same address ends up with one account.
 */
export async function upsertGoogleUser(profile: GoogleProfile): Promise<User> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    },
  });
}

export async function registerWithPassword(email: string, password: string): Promise<User> {
  const normalized = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  return prisma.user.create({
    data: {
      email: normalized,
      name: normalized.split('@')[0] ?? normalized,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  });
}

export async function loginWithPassword(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Same error for "no such user" and "wrong password" so the form cannot be used to probe emails.
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return user;
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
