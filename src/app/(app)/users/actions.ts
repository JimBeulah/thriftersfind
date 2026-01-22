"use server";

import { User, Branch, UserPermissions, Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getUsers(): Promise<User[]> {
  const users = await (prisma.user as any).findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      branch: true,
      role_rel: true
    }
  });

  return users.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    roleId: user.roleId,
    role: user.role_rel ? {
      id: user.role_rel.id,
      name: user.role_rel.name,
      createdAt: user.role_rel.createdAt ? user.role_rel.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: user.role_rel.updatedAt ? user.role_rel.updatedAt.toISOString() : new Date().toISOString(),
    } : null,
    branchId: user.branchId,
    branch: user.branch ? {
      id: user.branch.id,
      name: user.branch.name,
      createdAt: user.branch.createdAt ? user.branch.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: user.branch.updatedAt ? user.branch.updatedAt.toISOString() : new Date().toISOString(),
    } : null,
    permissions: user.permissions as UserPermissions | null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function getBranches(): Promise<Branch[]> {
  // Check if the branch model exists in the current client
  if (!(prisma as any).branch) {
    console.warn("Prisma client is out of sync: 'branch' model not found. Please run 'npx prisma generate'.");
    return [];
  }

  // Ensure Main Branch exists
  await (prisma as any).branch.upsert({
    where: { name: 'Main Branch' },
    update: {},
    create: { name: 'Main Branch' }
  });

  const branches = await (prisma as any).branch.findMany({
    orderBy: { name: 'asc' }
  });

  return (branches as any[]).map(branch => ({
    id: branch.id,
    name: branch.name,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  }));
}

export async function getRoles(): Promise<Role[]> {
  if (!(prisma as any).role) {
    console.warn("Prisma client is out of sync: 'role' model not found. Please run 'npx prisma generate'.");
    return [];
  }

  // Ensure Super Admin role exists
  await (prisma as any).role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin' }
  });

  // Ensure Staff role exists
  await (prisma as any).role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: { name: 'Staff' }
  });

  const roles = await (prisma as any).role.findMany({
    orderBy: { name: 'asc' }
  });

  return (roles as any[]).map(role => ({
    id: role.id,
    name: role.name,
    createdAt: role.createdAt ? role.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: role.updatedAt ? role.updatedAt.toISOString() : new Date().toISOString(),
  }));
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  branchId?: string;
  permissions?: UserPermissions;
}): Promise<{ user: User | null; error?: string }> {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    return { user: null, error: `A user with the email "${userData.email}" already exists.` };
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Find Role ID if role name is provided
  let roleConnect = undefined;
  if (userData.role) {
    const roleRecord = await (prisma as any).role.findUnique({
      where: { name: userData.role }
    });
    if (roleRecord) {
      roleConnect = { connect: { id: roleRecord.id } };
    }
  }

  // Find Branch ID logic (assuming simple connect by ID handled by string id passed)
  // But strictly speaking, prisma connect expects { id: ... } object usually or direct ID field setting.
  // Since we are setting `branchId` directly in data, we don't strictly need nested connect if the schema supports scalar field writing.
  // However, for role, we want to ensure the relation is set.

  // Create user
  // We set `role` string AND `role_rel` relation.
  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role, // Set the legacy string field
      role_rel: roleConnect, // Connect the relation
      branch: userData.branchId && userData.branchId !== 'none' ? { connect: { id: userData.branchId } } : undefined,
      permissions: userData.permissions || undefined,
    } as any,
    include: {
      role_rel: true,
      branch: true
    }
  });

  const user = newUser as any;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role_rel ? {
        id: user.role_rel.id,
        name: user.role_rel.name,
        createdAt: user.role_rel.createdAt.toISOString(),
        updatedAt: user.role_rel.updatedAt.toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt.toISOString(),
        updatedAt: user.branch.createdAt.toISOString(),
      } : null,
      permissions: user.permissions as UserPermissions | null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  };
}

export async function updateUser(
  id: string,
  userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    roleId?: string;
    branchId?: string;
    permissions?: UserPermissions;
  }
): Promise<{ user: User | null; error?: string }> {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    return { user: null, error: "User not found." };
  }

  // Check if email is already taken by another user
  const emailCheck = await prisma.user.findFirst({
    where: {
      email: userData.email,
      id: { not: id }
    }
  });

  if (emailCheck) {
    return { user: null, error: `A user with the email "${userData.email}" already exists.` };
  }

  // Find Role connection logic
  let roleConnect = undefined;
  // If roleId is provided, use it directly (preferred)
  if (userData.roleId && userData.roleId !== 'none') {
    roleConnect = { connect: { id: userData.roleId } };
  }
  // Fallback to finding by name if role string is provided (legacy support)
  else if (userData.role) {
    const roleRecord = await (prisma as any).role.findUnique({
      where: { name: userData.role }
    });
    if (roleRecord) {
      roleConnect = { connect: { id: roleRecord.id } };
    }
  }

  // Prepare update data
  const updateData: any = {
    name: userData.name,
    email: userData.email,
    permissions: userData.permissions,
  };

  if (userData.branchId && userData.branchId !== 'none') {
    updateData.branch = { connect: { id: userData.branchId } };
  } else if (userData.branchId === 'none' || userData.branchId === null) {
    updateData.branch = { disconnect: true };
  }

  // If role is being updated
  if (roleConnect) {
    updateData.role_rel = roleConnect;
  } else if (userData.roleId === 'none') {
    // If explicity set to none/no role
    updateData.role_rel = { disconnect: true };
  }

  // Add password update if provided
  if (userData.password && userData.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    updateData.password = hashedPassword;
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      role_rel: true,
      branch: true
    }
  });

  const user = updatedUser as any;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role_rel ? {
        id: user.role_rel.id,
        name: user.role_rel.name,
        createdAt: user.role_rel.createdAt.toISOString(),
        updatedAt: user.role_rel.updatedAt.toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt.toISOString(),
        updatedAt: user.branch.createdAt.toISOString(),
      } : null,
      permissions: user.permissions as UserPermissions | null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  };
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    // Delete all transactions (orders) created by this user
    try {
      // Use raw SQL to delete orders with JSON filtering
      const deletedOrders = await prisma.$executeRaw`
        DELETE FROM orders 
        WHERE JSON_EXTRACT(createdBy, '$.uid') = ${id}
      `;
      console.log(`Deleted ${deletedOrders} orders for user ${id}`);
    } catch (dbError) {
      console.error("Error deleting user orders:", dbError);
      // Continue to delete the user even if order deletion fails
    }

    await prisma.user.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}
