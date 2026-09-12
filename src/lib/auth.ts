import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-dentchart-at-least-32-chars-long'
);

const COOKIE_NAME = 'dentchart_session';

/**
 * DentOS v2 Session — role × branch-scope model
 * 
 * Role model (spec.md §1.2):
 * - dentist: clinical read/write within assigned branches
 * - staff: limited clinical read, operational tasks within assigned branches
 * - admin: full access within assigned branches, settings management
 * - owner: read-only cross-branch analytics, no clinical edit unless also a dentist
 * 
 * branchIds: ["*"] = all branches (owner), ["br_1","br_2"] = specific branches
 */
export interface UserSession {
  id: string;
  tenantId: string;
  branchIds: string[];
  email: string;
  name: string;
  role: 'dentist' | 'staff' | 'admin' | 'owner';
  hprId?: string;
}

export async function signSession(user: UserSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySession(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const verified = await verifySession(token);
    if (verified) return verified;
  }

  // Development convenience fallback: if running locally without a cookie,
  // default to the seeded primary dentist so the developer can navigate immediately
  if (process.env.NODE_ENV !== 'production') {
    return {
      id: 'usr_dentist_1',
      tenantId: 'tenant_apex',
      branchIds: ['br_koramangala'],
      email: 'dr.sharma@apexdental.in',
      name: 'Dr. Rajesh Sharma, MDS',
      role: 'dentist',
      hprId: 'HPR-KA-2024-00142',
    };
  }

  return null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Branch-scope helpers ──────────────────────────────────

/**
 * Check if a user session has access to a specific branch.
 * Owner with ["*"] has access to all branches.
 */
export function hasAccessToBranch(session: UserSession, branchId: string): boolean {
  if (session.branchIds.includes('*')) return true;
  return session.branchIds.includes(branchId);
}

/**
 * Get the SQL-safe branch filter for the current session.
 * Returns the branch IDs the user can access.
 */
export function getAccessibleBranches(session: UserSession): string[] | '*' {
  if (session.branchIds.includes('*')) return '*';
  return session.branchIds;
}

/**
 * Check if user has the required role.
 * Roles are NOT hierarchical — each grant is explicit.
 */
export function hasRole(session: UserSession, ...allowedRoles: UserSession['role'][]): boolean {
  return allowedRoles.includes(session.role);
}

/**
 * Combined check: role + branch access.
 * Returns null if authorized, or an error message string.
 */
export function authorize(
  session: UserSession | null,
  options: {
    roles?: UserSession['role'][];
    branchId?: string;
  }
): string | null {
  if (!session) return 'Not authenticated';
  if (options.roles && !hasRole(session, ...options.roles)) {
    return `Role '${session.role}' is not authorized for this action`;
  }
  if (options.branchId && !hasAccessToBranch(session, options.branchId)) {
    return `No access to branch '${options.branchId}'`;
  }
  return null;
}
