import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
// Migration chain: 14 × 20260725, 2 × 20260726, 4 × 20260728
const EXPECTED_MIGRATION_FILES = [
  ...Array.from({ length: 14 }, (_, i) => `20260725${String(i + 1).padStart(6, '0')}`),
  '20260726000001',
  '20260726000002',
  '20260728000001',
  '20260728000002',
  '20260728000003',
  '20260728000004',
  '20260728000005',
  '20260728000006',
];

function migrationFiles() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

function migrationSource() {
  return migrationFiles().map((file) => ({
    file,
    sql: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'),
  }));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function normalizeSql(value) {
  return value
    .trim()
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/timestamp with time zone/gi, 'timestamptz')
    .replaceAll(/timestamp without time zone/gi, 'timestamp')
    .replace(/time without time zone/gi, 'time')
    .replaceAll(/::(?:public\.)?[a-z_][a-z0-9_]*/gi, '')
    .replaceAll(/public\./gi, '')
    .trim();
}

function normalizeGeneratedExpression(value) {
  return normalizeSql(value)
    .replaceAll(/[()]/g, '')
    .replaceAll(/\s+/g, '')
    .toLowerCase();
}

function diff(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    missing: [...expectedSet].filter((value) => !actualSet.has(value)).sort(),
    unexpected: [...actualSet].filter((value) => !expectedSet.has(value)).sort(),
  };
}

function assertSetEqual(label, expected, actual) {
  const result = diff(expected, actual);
  assert.deepEqual(
    result,
    { missing: [], unexpected: [] },
    `${label} drifted:\n${JSON.stringify(result, null, 2)}`,
  );
}

function scanMigrationObjects() {
  const objects = {
    migrations: [],
    tables: [],
    tableColumns: new Map(),
    enums: new Map(),
    functions: [],
    securityDefinerFunctions: [],
    triggers: [],
    views: [],
    materializedViews: [],
    policies: [],
    rlsTables: [],
    buckets: new Map(),
  };

  for (const { file, sql } of migrationSource()) {
    const version = file.match(/^(\d+)_([^.]+)\.sql$/);
    if (version) {
      objects.migrations.push({ version: version[1], name: version[2] });
    }

    for (const match of sql.matchAll(/^CREATE TYPE\s+([a-z_][a-z0-9_]*)\s+AS ENUM\s*\(([\s\S]*?)\);/gmi)) {
      const labels = [...match[2].matchAll(/'((?:''|[^'])*)'/g)]
        .map((label) => label[1].replaceAll("''", "'"));
      objects.enums.set(match[1], labels);
    }

    for (const match of sql.matchAll(/^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)\s*\(/gmi)) {
      const tableName = match[1];
      const bodyStart = match.index + match[0].length;
      const body = balancedSqlBody(sql, bodyStart - 1);
      const columns = [];

      for (const definition of splitTopLevel(body)) {
        const trimmed = definition.trim();
        if (!trimmed || /^(PRIMARY|UNIQUE|CONSTRAINT|FOREIGN|CHECK|EXCLUDE)\b/i.test(trimmed)) {
          continue;
        }
        const column = trimmed.match(/^"?([a-z_][a-z0-9_]*)"?\s+/i);
        if (column) {
          const columnName = column[1];
          const rest = trimmed.slice(column[0].length);
          const typeMatch = rest.match(
            /^(.+?)(?=\s+(?:NOT\s+NULL|NULL|DEFAULT|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|CONSTRAINT|COLLATE|GENERATED)\b|$)/i,
          );
          const defaultMatch = rest.match(
            /\bDEFAULT\s+(.+?)(?=\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|CONSTRAINT|COLLATE|GENERATED)\b|$)/i,
          );
          const generatedMatch = rest.match(/\bGENERATED\s+ALWAYS\s+AS\s*\(([\s\S]*)\)\s+STORED$/i);
          columns.push({
            name: columnName,
            type: normalizeSql(typeMatch?.[1] ?? rest),
            nullable: !/\b(?:NOT\s+NULL|PRIMARY\s+KEY)\b/i.test(rest),
            hasDefault: Boolean(defaultMatch) && !generatedMatch,
            default: defaultMatch && !generatedMatch ? normalizeSql(defaultMatch[1]) : null,
            generated: generatedMatch ? normalizeGeneratedExpression(generatedMatch[1]) : null,
          });
        }
      }

      objects.tables.push(tableName);
      objects.tableColumns.set(
        tableName,
        columns.sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    // Parse ALTER TABLE … ADD COLUMN [IF NOT EXISTS] so the scanner picks up
    // columns that were added after the original CREATE TABLE migration.
    for (const match of sql.matchAll(
      /^ALTER TABLE\s+(?:IF EXISTS\s+)?([a-z_][a-z0-9_]*)\s+ADD COLUMN\s+(?:IF NOT EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?\s+([^;,\n]+)/gmi,
    )) {
      const tableName = match[1];
      const columnName = match[2];
      const rest = match[3].trim();
      const typeMatch = rest.match(
        /^(.+?)(?=\s+(?:NOT\s+NULL|NULL|DEFAULT|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|CONSTRAINT|COLLATE|GENERATED)\b|$)/i,
      );
      const defaultMatch = rest.match(
        /\bDEFAULT\s+(.+?)(?=\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|CONSTRAINT|COLLATE|GENERATED)\b|$)/i,
      );
      const nullable = !/\b(?:NOT\s+NULL|PRIMARY\s+KEY)\b/i.test(rest);
      const col = {
        name: columnName,
        type: normalizeSql(typeMatch?.[1] ?? rest),
        nullable,
        hasDefault: Boolean(defaultMatch),
        default: defaultMatch ? normalizeSql(defaultMatch[1]) : null,
        generated: null,
      };
      if (!objects.tableColumns.has(tableName)) objects.tableColumns.set(tableName, []);
      const cols = objects.tableColumns.get(tableName);
      if (!cols.some((c) => c.name === columnName)) {
        cols.push(col);
        cols.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    for (const match of sql.matchAll(/^CREATE OR REPLACE FUNCTION\s+([a-z_][a-z0-9_]*)\s*\(/gmi)) {
      objects.functions.push(match[1]);
      const functionEnd = sql.indexOf('$$;', match.index);
      const functionSql = sql.slice(match.index, functionEnd === -1 ? sql.length : functionEnd);
      if (/\bSECURITY DEFINER\b/i.test(functionSql)) {
        objects.securityDefinerFunctions.push(match[1]);
      }
    }

    objects.triggers.push(...[...sql.matchAll(/^CREATE TRIGGER\s+([a-z_][a-z0-9_]*)/gmi)].map((match) => match[1]));
    objects.views.push(...[...sql.matchAll(/^CREATE (?:OR REPLACE )?VIEW\s+([a-z_][a-z0-9_]*)/gmi)].map((match) => match[1]));
    objects.materializedViews.push(
      ...[...sql.matchAll(/^CREATE MATERIALIZED VIEW\s+([a-z_][a-z0-9_]*)/gmi)].map((match) => match[1]),
    );

    const policySchema = file.endsWith('_storage.sql') ? 'storage' : 'public';
    for (const match of sql.matchAll(/^CREATE POLICY\s+(?:"([^"]+)"|([a-z_][a-z0-9_]*))/gmi)) {
      objects.policies.push(`${policySchema}.${match[1] ?? match[2]}`);
    }

    objects.rlsTables.push(
      ...[...sql.matchAll(/^ALTER TABLE\s+([a-z_][a-z0-9_]*)\s+ENABLE ROW LEVEL SECURITY;/gmi)].map((match) => match[1]),
    );

    for (const match of sql.matchAll(/\('([^']+)',\s*'([^']+)',\s*(true|false),\s*(\d+)\)/g)) {
      objects.buckets.set(match[1], {
        name: match[2],
        public: match[3] === 'true',
        file_size_limit: Number(match[4]),
      });
    }
  }

  return {
    ...objects,
    migrations: objects.migrations.sort((a, b) => a.version.localeCompare(b.version)),
    tables: uniqueSorted(objects.tables),
    functions: uniqueSorted(objects.functions),
    securityDefinerFunctions: uniqueSorted(objects.securityDefinerFunctions),
    triggers: uniqueSorted(objects.triggers),
    views: uniqueSorted(objects.views),
    materializedViews: uniqueSorted(objects.materializedViews),
    policies: uniqueSorted(objects.policies),
    rlsTables: uniqueSorted(objects.rlsTables),
  };
}

function balancedSqlBody(sql, openingParenIndex) {
  let depth = 0;
  let quote = false;
  for (let index = openingParenIndex; index < sql.length; index += 1) {
    const character = sql[index];
    const next = sql[index + 1];
    if (character === "'" && next === "'") {
      index += 1;
      continue;
    }
    if (character === "'") {
      quote = !quote;
      continue;
    }
    if (quote) continue;
    if (character === '(') depth += 1;
    if (character === ')') {
      depth -= 1;
      if (depth === 0) return sql.slice(openingParenIndex + 1, index);
    }
  }
  throw new Error('Unclosed CREATE TABLE definition');
}

function splitTopLevel(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const next = value[index + 1];
    if (character === "'" && next === "'") {
      index += 1;
      continue;
    }
    if (character === "'") {
      quote = !quote;
      continue;
    }
    if (quote) continue;
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function projectRef() {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('VITE_SUPABASE_URL is required for DB-001A production validation');
  const host = new URL(url).hostname;
  const ref = host.split('.')[0];
  if (!ref) throw new Error('Could not derive Supabase project ref from VITE_SUPABASE_URL');
  return ref;
}

async function queryProduction(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required for DB-001A production validation');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef()}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const body = await response.json();
  if (!response.ok || !Array.isArray(body)) {
    throw new Error(`Supabase production query failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function productionSnapshot() {
  const [
    migrations,
    tables,
    columns,
    enums,
    functions,
    triggers,
    views,
    policies,
    rlsTables,
    buckets,
    extensions,
  ] = await Promise.all([
    queryProduction(`
      SELECT version::text, name
      FROM supabase_migrations.schema_migrations
      ORDER BY version
    `),
    queryProduction(`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      ORDER BY c.relname
    `),
    queryProduction(`
      SELECT c.relname AS table_name,
             a.attname AS column_name,
             format_type(a.atttypid, a.atttypmod) AS data_type,
             NOT a.attnotnull AS nullable,
             a.attgenerated AS generated_kind,
             pg_get_expr(ad.adbin, ad.adrelid) AS default_expr
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum
    `),
    queryProduction(`
      SELECT t.typname AS enum_name,
             json_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `),
    queryProduction(`
      SELECT p.proname AS function_name, p.prosecdef AS security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prokind = 'f'
      ORDER BY p.proname
    `),
    queryProduction(`
      SELECT t.tgname AS trigger_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT t.tgisinternal AND n.nspname IN ('public', 'auth')
      ORDER BY t.tgname
    `),
    queryProduction(`
      SELECT c.relname AS object_name, c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
      ORDER BY c.relkind, c.relname
    `),
    queryProduction(`
      SELECT schemaname, policyname
      FROM pg_policies
      WHERE schemaname IN ('public', 'storage')
      ORDER BY schemaname, policyname
    `),
    queryProduction(`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
      ORDER BY c.relname
    `),
    queryProduction(`
      SELECT id, name, public, file_size_limit
      FROM storage.buckets
      ORDER BY id
    `),
    queryProduction(`
      SELECT extname
      FROM pg_extension
      ORDER BY extname
    `),
  ]);

  const tableColumns = new Map();
  for (const row of columns) {
    const current = tableColumns.get(row.table_name) ?? [];
    current.push({
      name: row.column_name,
      type: normalizeSql(row.data_type),
      nullable: row.nullable,
      hasDefault: row.generated_kind === '' && row.default_expr !== null,
      default: row.generated_kind === '' && row.default_expr !== null
        ? normalizeSql(row.default_expr)
        : null,
      generated: row.generated_kind === 's' && row.default_expr !== null
        ? normalizeGeneratedExpression(row.default_expr)
        : null,
    });
    tableColumns.set(row.table_name, current);
  }

  const enumLabels = new Map(enums.map((row) => [row.enum_name, row.labels]));
  const functionNames = functions.map((row) => row.function_name);
  const securityDefinerFunctions = functions
    .filter((row) => row.security_definer)
    .map((row) => row.function_name);

  return {
    migrations: migrations.map((row) => ({ version: row.version, name: row.name })),
    tables: tables.map((row) => row.table_name),
    tableColumns,
    enums: enumLabels,
    functions: functionNames,
    securityDefinerFunctions,
    triggers: triggers.map((row) => row.trigger_name),
    views: views.filter((row) => row.relkind === 'v').map((row) => row.object_name),
    materializedViews: views.filter((row) => row.relkind === 'm').map((row) => row.object_name),
    policies: policies.map((row) => `${row.schemaname}.${row.policyname}`),
    rlsTables: rlsTables.map((row) => row.table_name),
    buckets: new Map(buckets.map((row) => [
      row.id,
      {
        name: row.name,
        public: row.public,
        file_size_limit: Number(row.file_size_limit),
      },
    ])),
    extensions: extensions.map((row) => row.extname),
  };
}

function compareBuckets(expected, actual) {
  const expectedIds = [...expected.keys()].sort();
  const actualIds = [...actual.keys()].sort();
  assertSetEqual('storage bucket ids', expectedIds, actualIds);
  for (const id of expectedIds) {
    assert.deepEqual(actual.get(id), expected.get(id), `storage bucket "${id}" drifted`);
  }
}

test('DB-001A production schema contract', async () => {
  const expected = scanMigrationObjects();
  const actual = await productionSnapshot();

  assert.deepEqual(
    expected.migrations,
    actual.migrations,
    'production migration history is incomplete or out of sync',
  );
  assert.deepEqual(
    expected.migrations.map(({ version }) => version),
    EXPECTED_MIGRATION_FILES,
    'repository DB-001A migration chain must contain exactly 20 ordered migrations',
  );

  assertSetEqual('public tables', expected.tables, actual.tables);
  for (const tableName of expected.tables) {
    assert.deepEqual(
      expected.tableColumns.get(tableName) ?? [],
      (actual.tableColumns.get(tableName) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      `columns for public.${tableName} drifted`,
    );
  }

  assertSetEqual('public enum names', [...expected.enums.keys()], [...actual.enums.keys()]);
  for (const [enumName, labels] of expected.enums) {
    assert.deepEqual(actual.enums.get(enumName), labels, `enum ${enumName} labels drifted`);
  }

  assertSetEqual('public function names', expected.functions, actual.functions);
  assertSetEqual(
    'SECURITY DEFINER function names',
    expected.securityDefinerFunctions,
    actual.securityDefinerFunctions,
  );
  assertSetEqual('public/auth trigger names', expected.triggers, actual.triggers);
  assertSetEqual('public view names', expected.views, actual.views);
  assertSetEqual('public materialized view names', expected.materializedViews, actual.materializedViews);
  assertSetEqual('public/storage policy names', expected.policies, actual.policies);
  assertSetEqual('RLS-enabled public tables', expected.rlsTables, actual.rlsTables);
  compareBuckets(expected.buckets, actual.buckets);
  assert.ok(actual.extensions.includes('pgcrypto'), 'required pgcrypto extension is missing');

  console.log(JSON.stringify({
    migrationCount: actual.migrations.length,
    tableCount: actual.tables.length,
    enumCount: actual.enums.size,
    functionCount: actual.functions.length,
    triggerCount: actual.triggers.length,
    viewCount: actual.views.length,
    materializedViewCount: actual.materializedViews.length,
    policyCount: actual.policies.length,
    rlsTableCount: actual.rlsTables.length,
    bucketCount: actual.buckets.size,
    status: 'PASS',
  }));
});

test('DB-001A production Auth integrity contract', async () => {
  const issues = await queryProduction(`
    SELECT
      u.id::text AS user_id,
      array_remove(
        ARRAY[
          CASE
            WHEN NOT COALESCE(u.is_anonymous, false)
              AND u.email IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM auth.identities i
                WHERE i.user_id = u.id
                  AND i.provider = 'email'
              )
            THEN 'missing_email_identity'
          END,
          CASE WHEN u.email_change_token_new IS NULL
            THEN 'email_change_token_new_null' END,
          CASE WHEN u.email_change IS NULL
            THEN 'email_change_null' END
        ]::text[],
        NULL
      ) AS issue_codes
    FROM auth.users u
    WHERE (
      (
        NOT COALESCE(u.is_anonymous, false)
        AND u.email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM auth.identities i
          WHERE i.user_id = u.id
            AND i.provider = 'email'
        )
      )
      OR u.email_change_token_new IS NULL
      OR u.email_change IS NULL
    )
  `);

  assert.deepEqual(
    issues,
    [],
    `production Auth integrity issues detected:\n${JSON.stringify(issues, null, 2)}`,
  );

  console.log(JSON.stringify({
    checked: 'auth.users identity relationships and email-change defaults',
    issueCount: issues.length,
    status: 'PASS',
  }));
});