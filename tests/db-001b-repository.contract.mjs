/**
 * DB-001B Repository Contract Test
 *
 * Static analysis of the DB-001B repository layer:
 *   - Verifies all expected repository files exist.
 *   - Verifies each file targets the correct DB-001A table names.
 *   - Verifies no legacy table/column names survive.
 *   - Verifies required exported functions are declared.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/db-001b-repository.contract.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.join(ROOT, 'src', 'repositories');

function repoPath(filename) {
  return path.join(REPO_DIR, filename);
}

function readRepo(filename) {
  return fs.readFileSync(repoPath(filename), 'utf8');
}

function repoExists(filename) {
  return fs.existsSync(repoPath(filename));
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract 1: All DB-001B repository files exist
// ─────────────────────────────────────────────────────────────────────────────

test('DB-001B repository files exist', () => {
  const required = [
    'userProfileRepository.ts',
    'workspaceRepository.ts',
    'workspaceMembersRepository.ts',
    'workspaceInvitationsRepository.ts',
    'workspaceSubscriptionRepository.ts',
    'notificationRepository.ts',
  ];

  for (const file of required) {
    assert.ok(
      repoExists(file),
      `Missing DB-001B repository file: src/repositories/${file}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: No legacy table or column names survive in any repository
// ─────────────────────────────────────────────────────────────────────────────

// These patterns are checked as quoted DB column/table strings only (e.g. .from('profiles')).
// Plain TypeScript identifiers that happen to share a name are NOT flagged.
const FORBIDDEN_PATTERNS = [
  // Legacy table names replaced in DB-001B-2
  { pattern: "'profiles'",          reason: 'DB-001A uses user_profiles, not profiles' },
  { pattern: '"profiles"',          reason: 'DB-001A uses user_profiles, not profiles' },
  { pattern: "'news_events'",       reason: 'DB-001A uses news_publications, not news_events' },
  { pattern: '"news_events"',       reason: 'DB-001A uses news_publications, not news_events' },
  // Legacy workspace column names as DB strings (inside .from()/.eq()/.select() etc.)
  { pattern: "'workspace_uuid'",    reason: 'DB-001A workspaces PK is id, not workspace_uuid' },
  { pattern: '"workspace_uuid"',    reason: 'DB-001A workspaces PK is id, not workspace_uuid' },
  { pattern: "'workspace_name'",    reason: 'DB-001A uses name, not workspace_name' },
  { pattern: '"workspace_name"',    reason: 'DB-001A uses name, not workspace_name' },
  { pattern: "'workspace_status'",  reason: 'DB-001A uses status, not workspace_status' },
  { pattern: '"workspace_status"',  reason: 'DB-001A uses status, not workspace_status' },
  { pattern: "'workspace_plan'",    reason: 'DB-001A uses workspace_subscriptions table, not workspace_plan column' },
  { pattern: '"workspace_plan"',    reason: 'DB-001A uses workspace_subscriptions table, not workspace_plan column' },
  { pattern: "'owner_user_uuid'",   reason: 'DB-001A uses owner_id, not owner_user_uuid' },
  { pattern: '"owner_user_uuid"',   reason: 'DB-001A uses owner_id, not owner_user_uuid' },
];

test('DB-001B repositories contain no legacy table or column references', () => {
  const files = fs.readdirSync(REPO_DIR).filter((f) => f.endsWith('.ts'));

  assert.ok(files.length > 0, 'No repository files found');

  for (const file of files) {
    const source = readRepo(file);

    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      assert.ok(
        !source.includes(pattern),
        `${file} contains forbidden DB reference "${pattern}": ${reason}`,
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: userProfileRepository — table + exports
// ─────────────────────────────────────────────────────────────────────────────

test('userProfileRepository: targets user_profiles and exports required functions', () => {
  const src = readRepo('userProfileRepository.ts');

  assert.ok(src.includes("'user_profiles'"), 'Must query the user_profiles table');
  assert.ok(src.includes('repoGetUserProfile'), 'Must export repoGetUserProfile');
  assert.ok(src.includes('repoUpsertUserProfile'), 'Must export repoUpsertUserProfile');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: workspaceRepository — table + exports
// ─────────────────────────────────────────────────────────────────────────────

test('workspaceRepository: targets workspaces and exports required functions', () => {
  const src = readRepo('workspaceRepository.ts');

  assert.ok(src.includes("'workspaces'"), 'Must query the workspaces table');
  assert.ok(src.includes('repoInsertWorkspace'), 'Must export repoInsertWorkspace');
  assert.ok(src.includes('repoPatchWorkspace'), 'Must export repoPatchWorkspace');
  assert.ok(src.includes('repoDeleteWorkspace'), 'Must export repoDeleteWorkspace');
  assert.ok(
    src.includes('repoGetWorkspacesByOwner') || src.includes('repoGetAllWorkspaces'),
    'Must export a workspace list function',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: workspaceMembersRepository — table + exports
// ─────────────────────────────────────────────────────────────────────────────

test('workspaceMembersRepository: targets workspace_members and exports required functions', () => {
  const src = readRepo('workspaceMembersRepository.ts');

  assert.ok(src.includes("'workspace_members'"), 'Must query the workspace_members table');
  assert.ok(src.includes('repoGetMembersByWorkspace'), 'Must export repoGetMembersByWorkspace');
  assert.ok(src.includes('repoInsertMember'), 'Must export repoInsertMember');
  assert.ok(src.includes('repoUpdateMemberRole'), 'Must export repoUpdateMemberRole');
  assert.ok(src.includes('repoDeleteMember'), 'Must export repoDeleteMember');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: workspaceInvitationsRepository — table + exports
// ─────────────────────────────────────────────────────────────────────────────

test('workspaceInvitationsRepository: targets workspace_invitations and exports required functions', () => {
  const src = readRepo('workspaceInvitationsRepository.ts');

  assert.ok(src.includes("'workspace_invitations'"), 'Must query the workspace_invitations table');
  assert.ok(src.includes('repoListWorkspaceInvitations'), 'Must export repoListWorkspaceInvitations');
  assert.ok(src.includes('repoListPendingInvitations'), 'Must export repoListPendingInvitations');
  assert.ok(src.includes('repoCreateInvitation'), 'Must export repoCreateInvitation');
  assert.ok(src.includes('repoRevokeInvitation'), 'Must export repoRevokeInvitation');
  assert.ok(src.includes('repoAcceptInvitationByToken'), 'Must export repoAcceptInvitationByToken');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: workspaceSubscriptionRepository — tables + exports
// ─────────────────────────────────────────────────────────────────────────────

test('workspaceSubscriptionRepository: targets workspace_subscriptions + subscription_plans and exports required functions', () => {
  const src = readRepo('workspaceSubscriptionRepository.ts');

  assert.ok(src.includes("'workspace_subscriptions'"), 'Must query the workspace_subscriptions table');
  assert.ok(src.includes("'subscription_plans'"), 'Must query the subscription_plans table');
  assert.ok(src.includes('repoGetWorkspaceSubscription'), 'Must export repoGetWorkspaceSubscription');
  assert.ok(src.includes('repoListSubscriptionPlans'), 'Must export repoListSubscriptionPlans');
  assert.ok(src.includes('repoGetSubscriptionPlanByKey'), 'Must export repoGetSubscriptionPlanByKey');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 8: notificationRepository — table + exports
// ─────────────────────────────────────────────────────────────────────────────

test('notificationRepository: targets notifications and exports required functions', () => {
  const src = readRepo('notificationRepository.ts');

  assert.ok(src.includes("'notifications'"), 'Must query the notifications table');
  assert.ok(
    src.includes('repoGetNotifications') || src.includes('repoListNotifications'),
    'Must export a notifications list/get function',
  );
  assert.ok(
    src.includes('repoMarkAllNotificationsRead') || src.includes('repoMarkRead'),
    'Must export a mark-read function',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 9: DB-001A table names used by repositories are all valid
// ─────────────────────────────────────────────────────────────────────────────

const VALID_DB001A_TABLES = new Set([
  'platform_config',
  'user_profiles',
  'workspaces',
  'workspace_members',
  'workspace_invitations',
  'workspace_relationships',
  'workspace_custom_roles',   // created in 20260726000001_workspace_custom_roles.sql
  'livestock_photos',         // created in 20260725000005_workspace_livestock.sql
  'ownership_transfers',
  'workspace_subscriptions',
  'subscription_plans',
  'feature_policies',
  'notifications',
  'alert_reminders',
  'news_publications',
  'marketplace_listings',
  'marketplace_categories',
  'global_audit_trail',
  'system_logs',
  'media',
  'ai_insights',
  'search_index',
  'trust_verifications',
  'trust_verification_evidence',
  'data_master',
  'global_reference',
  'backup_records',
  'admin_announcements',
  'escrow_accounts',
  'rss_sources',
]);

test('DB-001B repositories only query tables that exist in DB-001A', () => {
  // Extract all .from('table_name') references from repository source files
  const files = fs.readdirSync(REPO_DIR).filter((f) => f.endsWith('.ts'));
  const fromRegex = /\.from\(['"]([a-z_]+)['"]\)/g;

  for (const file of files) {
    const source = readRepo(file);
    let match;

    while ((match = fromRegex.exec(source)) !== null) {
      const tableName = match[1];
      assert.ok(
        VALID_DB001A_TABLES.has(tableName),
        `${file} queries table "${tableName}" which is not in the DB-001A valid table set`,
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('DB-001B repository contract summary', () => {
  const files = fs.readdirSync(REPO_DIR).filter((f) => f.endsWith('.ts'));

  const summary = {
    repositoryCount: files.length,
    repositories:    files,
    status:          'PASS',
  };

  // Log the summary for visibility in CI output
  console.log(JSON.stringify(summary));

  assert.ok(files.length >= 6, `Expected at least 6 repositories, found ${files.length}`);
});
