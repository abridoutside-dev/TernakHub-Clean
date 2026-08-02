const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePotentialJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return value;
}

export function normalizeStoredWorkspaceUuid(value: unknown): string | null {
  if (typeof value === 'string') {
    const parsed = parsePotentialJson(value);
    if (parsed !== value) {
      return normalizeStoredWorkspaceUuid(parsed);
    }
    return UUID_PATTERN.test(value) ? value : null;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown> & {
      workspace?: Record<string, unknown>;
    };
    const candidates = [
      record.workspace_uuid,
      record.workspaceUuid,
      record.uuid,
      record.id,
      record.workspace?.workspace_uuid,
      record.workspace?.workspaceUuid,
      record.workspace?.uuid,
      record.workspace?.id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && UUID_PATTERN.test(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export function normalizeRecentWorkspaceList(value: unknown): string[] {
  if (typeof value === 'string') {
    return normalizeRecentWorkspaceList(parsePotentialJson(value));
  }

  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => normalizeStoredWorkspaceUuid(entry))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(normalized));
}
