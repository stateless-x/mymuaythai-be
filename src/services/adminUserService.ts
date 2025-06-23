import { db } from '../db/config';
import * as schema from '../db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'staff';
}

export interface UpdateAdminUserRequest {
  email?: string;
  password?: string;
  role?: 'admin' | 'staff';
  is_active?: boolean;
}

// Validation schemas
export const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'staff'], { required_error: 'Role must be admin or staff' }),
});

export const updateAdminUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'staff']).optional(),
  is_active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Service functions
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  const adminUsers = await db.select({
    id: schema.adminUsers.id,
    email: schema.adminUsers.email,
    role: schema.adminUsers.role,
    is_active: schema.adminUsers.is_active,
    created_at: schema.adminUsers.created_at,
    updated_at: schema.adminUsers.updated_at,
  }).from(schema.adminUsers);

  return adminUsers as AdminUser[];
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const adminUser = await db.select({
    id: schema.adminUsers.id,
    email: schema.adminUsers.email,
    role: schema.adminUsers.role,
    is_active: schema.adminUsers.is_active,
    created_at: schema.adminUsers.created_at,
    updated_at: schema.adminUsers.updated_at,
  }).from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, id))
    .limit(1);

  return adminUser[0] as AdminUser || null;
}

export async function getAdminUserByEmail(email: string): Promise<(AdminUser & { password: string }) | null> {
  const adminUser = await db.select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
    .limit(1);

  return adminUser[0] as (AdminUser & { password: string }) || null;
}

export async function createAdminUser(userData: CreateAdminUserRequest): Promise<AdminUser> {
  // Validate input
  const validationResult = createAdminUserSchema.safeParse(userData);
  if (!validationResult.success) {
    throw new Error(`Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
  }

  // Check if email already exists
  const existingUser = await db.select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, userData.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('Email already exists');
  }

  // Check total user limit (max 3 users - including both active and inactive)
  const totalUserCount = await db.select({ count: count() })
    .from(schema.adminUsers);

  if ((totalUserCount[0]?.count ?? 0) >= 3) {
    throw new Error('Maximum 3 users allowed');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const newUser = await db.insert(schema.adminUsers)
    .values({
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      updated_at: sql`NOW()`,
    })
    .returning({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      role: schema.adminUsers.role,
      is_active: schema.adminUsers.is_active,
      created_at: schema.adminUsers.created_at,
      updated_at: schema.adminUsers.updated_at,
    });

  if (!newUser[0]) {
    throw new Error('Failed to create user');
  }
  return newUser[0] as AdminUser;
}

export async function updateAdminUser(id: string, userData: UpdateAdminUserRequest): Promise<AdminUser | null> {
  // Validate input
  const validationResult = updateAdminUserSchema.safeParse(userData);
  if (!validationResult.success) {
    throw new Error(`Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
  }

  // Check if user exists
  const existingUser = await getAdminUserById(id);
  if (!existingUser) {
    return null;
  }

  // Check email uniqueness if email is being updated
  if (userData.email && userData.email !== existingUser.email) {
    const emailExists = await db.select()
      .from(schema.adminUsers)
      .where(and(
        eq(schema.adminUsers.email, userData.email),
        sql`${schema.adminUsers.id} != ${id}`
      ))
      .limit(1);

    if (emailExists.length > 0) {
      throw new Error('Email already exists');
    }
  }

  // No need to check user limit when updating existing users since they're already counted

  // Prepare update data
  const updateData: any = {
    updated_at: sql`NOW()`,
  };

  if (userData.email) updateData.email = userData.email;
  if (userData.role) updateData.role = userData.role;
  if (userData.is_active !== undefined) updateData.is_active = userData.is_active;
  if (userData.password) updateData.password = await hashPassword(userData.password);

  // Update user
  const updatedUser = await db.update(schema.adminUsers)
    .set(updateData)
    .where(eq(schema.adminUsers.id, id))
    .returning({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      role: schema.adminUsers.role,
      is_active: schema.adminUsers.is_active,
      created_at: schema.adminUsers.created_at,
      updated_at: schema.adminUsers.updated_at,
    });

  return updatedUser[0] as AdminUser || null;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  // Check if user exists
  const existingUser = await getAdminUserById(id);
  if (!existingUser) {
    return false;
  }

  // Check if this is the last admin
  if (existingUser.role === 'admin') {
    const adminCount = await db.select({ count: count() })
      .from(schema.adminUsers)
      .where(and(
        eq(schema.adminUsers.role, 'admin'),
        eq(schema.adminUsers.is_active, true)
      ));

    if ((adminCount[0]?.count ?? 0) <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

  // Delete user
  const result = await db.delete(schema.adminUsers)
    .where(eq(schema.adminUsers.id, id))
    .returning({ id: schema.adminUsers.id });

  return result.length > 0;
}

export async function authenticateAdminUser(email: string, password: string): Promise<AdminUser | null> {
  // Validate input
  const validationResult = loginSchema.safeParse({ email, password });
  if (!validationResult.success) {
    return null;
  }

  // Get user with password
  const userWithPassword = await getAdminUserByEmail(email);
  if (!userWithPassword) {
    return null;
  }

  // Check if user is inactive
  if (!userWithPassword.is_active) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, userWithPassword.password);
  if (!isPasswordValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...user } = userWithPassword;
  return user as AdminUser;
}

export async function getAdminCount(): Promise<number> {
  const result = await db.select({ count: count() })
    .from(schema.adminUsers)
    .where(and(
      eq(schema.adminUsers.role, 'admin'),
      eq(schema.adminUsers.is_active, true)
    ));

  return result[0]?.count ?? 0;
}

export async function getTotalUserCount(): Promise<number> {
  const result = await db.select({ count: count() })
    .from(schema.adminUsers);

  return result[0]?.count ?? 0;
} 