// U-002 — Atomic user registration orchestration.
//
// Supabase Auth and PostgREST writes do not share one database transaction.
// This module therefore uses a compensating transaction: every resource created
// before a later failure is explicitly removed before the error is returned.

export interface AtomicRegistrationInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  province: string;
  regency: string;
  district: string;
  village: string;
}

export interface RegistrationWorkspaceInput {
  ownerId: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  district: string;
  village: string;
}

export interface RegistrationAdapter {
  createAuthUser(input: AtomicRegistrationInput): Promise<{ id: string }>;
  deleteAuthUser(userId: string): Promise<void>;
  upsertUserProfile(input: AtomicRegistrationInput & { userId: string }): Promise<void>;
  deleteUserProfile(userId: string): Promise<void>;
  createWorkspace(input: RegistrationWorkspaceInput): Promise<{ id: string }>;
  deleteWorkspace(workspaceId: string): Promise<void>;
}

export class RegistrationStepError extends Error {
  constructor(
    message: string,
    public readonly resourceId?: string,
  ) {
    super(message);
    this.name = 'RegistrationStepError';
  }
}

export class AtomicRegistrationError extends Error {
  constructor(
    message: string,
    public readonly step: 'auth' | 'profile' | 'workspace' | 'rollback',
    public readonly rollbackErrors: unknown[] = [],
  ) {
    super(message);
    this.name = 'AtomicRegistrationError';
  }
}

/**
 * Creates auth.users → user_profiles → default workspace.
 *
 * Supabase's Admin Auth API commits auth.users independently from table
 * writes, so rollback is deliberately explicit and best-effort. The error
 * retains rollback failures for server logs, while callers receive a generic
 * registration error and never a partial-success response.
 */
export async function registerUserAtomically(
  input: AtomicRegistrationInput,
  adapter: RegistrationAdapter,
): Promise<{ userId: string; workspaceId: string }> {
  let userId: string | undefined;
  let workspaceId: string | undefined;
  let step: AtomicRegistrationError['step'] = 'auth';

  try {
    const authUser = await adapter.createAuthUser(input);
    userId = authUser.id;

    step = 'profile';
    await adapter.upsertUserProfile({ ...input, userId });

    step = 'workspace';
    const workspace = await adapter.createWorkspace({
      ownerId: userId,
      name: input.fullName.trim(),
      slug: `${slugify(input.fullName)}-${userId.slice(0, 8)}`,
      phone: input.phone,
      email: input.email.trim().toLowerCase(),
      province: input.province,
      city: input.regency,
      district: input.district,
      village: input.village,
    });
    workspaceId = workspace.id;

    return { userId, workspaceId };
  } catch (error) {
    const rollbackErrors: unknown[] = [];

    // A workspace may have been allocated before its membership/bootstrap
    // write failed. Remove it before deleting the owner auth record.
    if (workspaceId || (error instanceof RegistrationStepError && error.resourceId)) {
      try {
        await adapter.deleteWorkspace(
          workspaceId ?? (error as RegistrationStepError).resourceId!,
        );
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    if (userId) {
      try {
        await adapter.deleteUserProfile(userId);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      try {
        await adapter.deleteAuthUser(userId);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    throw new AtomicRegistrationError(
      error instanceof Error ? error.message : 'Registration failed.',
      rollbackErrors.length > 0 ? 'rollback' : step,
      rollbackErrors,
    );
  }
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'workspace';
}