// U-002 — Supabase Admin API adapter for atomic registration.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import {
  registerUserAtomically,
  RegistrationStepError,
  type AtomicRegistrationInput,
  type RegistrationAdapter,
} from './atomicRegistration';

interface SupabaseRegistrationConfig {
  url: string;
  serviceRoleKey: string;
}

function createAdminClient(config: SupabaseRegistrationConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function makeAdapter(admin: SupabaseClient): RegistrationAdapter {
  return {
    async createAuthUser(input) {
      const { data, error } = await admin.auth.admin.createUser({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName.trim(),
          phone: input.phone,
          province: input.province,
          regency: input.regency,
          district: input.district,
          village: input.village,
          subscription: 'FREE',
          foto: '👤',
        },
      });
      if (error || !data.user?.id) {
        throw new Error(error?.message ?? 'Auth user was not created.');
      }
      return { id: data.user.id };
    },

    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },

    async upsertUserProfile(input) {
      const { error } = await admin
        .from('user_profiles')
        .upsert(
          {
            id: input.userId,
            full_name: input.fullName.trim(),
            phone_number: input.phone,
          },
          { onConflict: 'id' },
        );
      if (error) throw error;
    },

    async deleteUserProfile(userId) {
      const { error } = await admin.from('user_profiles').delete().eq('id', userId);
      if (error) throw error;
    },

    async createWorkspace(input) {
      // Allocate the ID before the request so a successful INSERT followed by
      // a response/select failure still has a cleanup handle.
      const workspaceId = randomUUID();
      let workspace: { id: string } | null = null;
      try {
        const { data, error } = await admin
          .from('workspaces')
          .insert({
            id: workspaceId,
            owner_id: input.ownerId,
            name: input.name,
            type: 'Farm',
            status: 'Aktif',
            province: input.province,
            city: input.city,
            district: input.district,
            village: input.village,
            phone: input.phone,
            email: input.email,
            metadata: {
              slug: input.slug,
              plan: 'Free',
              timezone: 'Asia/Jakarta',
              currency: 'IDR',
              language: 'id',
              registration: 'atomic',
            },
          })
          .select('id')
          .single();
        if (error || !data?.id) {
          throw new Error(error?.message ?? 'Default workspace was not created.');
        }
        workspace = data as { id: string };
      } catch (error) {
        throw new RegistrationStepError(
          error instanceof Error ? error.message : 'Default workspace was not created.',
          workspaceId,
        );
      }

      try {
        const { error: memberError } = await admin
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: input.ownerId,
            role: 'Owner',
            status: 'Aktif',
            joined_at: new Date().toISOString(),
          });
        if (memberError) throw memberError;
      } catch (error) {
        try {
          await this.deleteWorkspace(workspace.id);
        } catch (cleanupError) {
          throw new RegistrationStepError(
            `Workspace owner membership failed: ${
              error instanceof Error ? error.message : String(error)
            }; workspace cleanup also failed.`,
            workspace.id,
          );
        }
        throw error;
      }

      return { id: workspace.id as string };
    },

    async deleteWorkspace(workspaceId) {
      const { error } = await admin.from('workspaces').delete().eq('id', workspaceId);
      if (error) throw error;
    },
  };
}

export function validateRegistrationInput(input: AtomicRegistrationInput): string | null {
  if (!input.email.trim() || !input.password || !input.fullName.trim()) {
    return 'Data registrasi tidak lengkap.';
  }
  return null;
}

export async function registerWithSupabaseAdmin(
  input: AtomicRegistrationInput,
  config: SupabaseRegistrationConfig,
): Promise<{ userId: string; workspaceId: string }> {
  const validationError = validateRegistrationInput(input);
  if (validationError) throw new Error(validationError);
  return registerUserAtomically(input, makeAdapter(createAdminClient(config)));
}