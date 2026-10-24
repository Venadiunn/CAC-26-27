import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getIssueById } from '../services/issues';

export const SAVED_ARTICLES_KEY = 'voice-pulse:saved-articles';
export const SAVED_DRAFTS_KEY = 'voice-pulse:saved-drafts';
export const SAVED_ISSUES_KEY = 'voice-pulse:saved-issues';

type DraftRow = {
  user_id: string;
  client_id: string;
  title: string;
  issue_id: string | null;
  content: string;
  updated_at: string;
};

async function readJson<T>(key: string, fallback: T[]): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function getUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Could not restore the Supabase session: ${error.message}`);
  }
  return data.session?.user.id ?? null;
}

function userStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:user:${userId}` : key;
}

function isMissingTable(error: { code?: string; message?: string }, table: string): boolean {
  const message = error.message?.toLowerCase() ?? '';
  const targetTable = message.includes(table.toLowerCase());
  return targetTable && (error.code === 'PGRST205' || error.code === '42P01' || message.includes('schema cache'));
}

async function importLocalIssues(userId: string, localKey: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const localIssues = await readJson<{ id: string }>(localKey, []);
  const issueIds = [...new Set(localIssues.map((item) => item.id).filter(Boolean))];
  if (issueIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('saved_issues')
    .upsert(issueIds.map((issueId) => ({ user_id: userId, issue_id: issueId })), {
      onConflict: 'user_id,issue_id',
      ignoreDuplicates: true,
    });
  if (error) {
    if (isMissingTable(error, 'saved_issues')) {
      return;
    }
    throw syncStorageError('Importing saved issues', error.message);
  }

  const { data, error: verifyError } = await supabase
    .from('saved_issues')
    .select('issue_id')
    .eq('user_id', userId)
    .in('issue_id', issueIds);
  if (verifyError) {
    throw syncStorageError('Verifying saved issues', verifyError.message);
  }
  if ((data ?? []).length !== issueIds.length) {
    throw syncStorageError('Verifying saved issues', 'Some local records are not confirmed in the cloud.');
  }

  await AsyncStorage.removeItem(localKey);
}

async function moveLegacyIssuesToAccount(userId: string): Promise<void> {
  const accountKey = userStorageKey(SAVED_ISSUES_KEY, userId);
  const legacyIssues = await readJson<{ id: string }>(SAVED_ISSUES_KEY, []);
  if (legacyIssues.length === 0) {
    return;
  }

  const accountIssues = await readJson<{ id: string }>(accountKey, []);
  const merged = new Map<string, { id: string }>();
  for (const issue of [...accountIssues, ...legacyIssues]) {
    if (issue.id && !merged.has(issue.id)) {
      merged.set(issue.id, issue);
    }
  }

  await AsyncStorage.setItem(accountKey, JSON.stringify([...merged.values()]));
  await AsyncStorage.removeItem(SAVED_ISSUES_KEY);
}

function storageError(action: string, message: string): Error {
  return new Error(`${action} failed: ${message}`);
}

function syncStorageError(action: string, message: string): Error {
  return new Error(`${action} failed. Local copies were retained. ${message}`);
}

function itemId(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return null;
  }
  const id = (value as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function issueId(value: unknown): string | null {
  return itemId(value);
}

function draftFields(value: unknown, userId: string, clientId: string): DraftRow {
  const draft = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const issue = typeof draft.issueId === 'string' ? draft.issueId : null;
  return {
    user_id: userId,
    client_id: clientId,
    title: typeof draft.subject === 'string' ? draft.subject : typeof draft.title === 'string' ? draft.title : 'Untitled draft',
    issue_id: issue,
    content: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  };
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16);
}

export async function getSavedArticles<T>(): Promise<T[]> {
  return readJson<T>(SAVED_ARTICLES_KEY, []);
}

export async function saveArticle<T>(value: T): Promise<void> {
  const current = await getSavedArticles<T>();
  const items = current.some((item) => JSON.stringify(item) === JSON.stringify(value))
    ? current
    : [value, ...current];

  await AsyncStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(items));
}

export async function removeSavedArticle<T>(matcher: (value: T) => boolean): Promise<void> {
  const current = await getSavedArticles<T>();
  const next = current.filter((item) => !matcher(item));
  await AsyncStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(next));
}

export async function getSavedIssues<T>(): Promise<T[]> {
  const userId = await getUserId();
  const localKey = userStorageKey(SAVED_ISSUES_KEY, userId);
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('saved_issues')
      .select('issue_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error, 'saved_issues')) {
        return readJson<T>(localKey, []);
      }
      throw storageError('Loading saved issues', error.message);
    }

    const localIssues = await readJson<T>(localKey, []);
    await importLocalIssues(userId, localKey);

    const saved: T[] = [];
    const savedIds = new Set<string>();
    for (const row of data ?? []) {
      savedIds.add(row.issue_id);
      const issue = getIssueById(row.issue_id);
      if (issue) {
        saved.push(issue as T);
      } else {
        saved.push({
          id: row.issue_id,
          title: 'Saved issue no longer in the catalog',
          category: '',
          summary: 'This issue ID is no longer available in the current catalog. You can remove it from saved issues.',
          subtopics: [],
          keywords: [],
          governmentLevels: [],
          affectedGroups: [],
          policyQuestions: [],
          sources: [],
          relatedIssues: [],
          lastVerified: '',
          catalogMissing: true,
        } as unknown as T);
      }
    }

    for (const issue of localIssues) {
      const id = itemId(issue);
      if (id && !savedIds.has(id)) {
        saved.push(issue);
      }
    }
    return saved;
  }
  return readJson<T>(SAVED_ISSUES_KEY, []);
}

export async function saveIssue<T>(value: T): Promise<void> {
  const userId = await getUserId();
  const savedId = issueId(value);
  if (userId && supabase) {
    if (!savedId) {
      throw new Error('Cannot save this issue because it has no catalog ID.');
    }
    const { error } = await supabase
      .from('saved_issues')
      .upsert({ user_id: userId, issue_id: savedId }, { onConflict: 'user_id,issue_id', ignoreDuplicates: true });
    if (error) {
      if (isMissingTable(error, 'saved_issues')) {
        const localKey = userStorageKey(SAVED_ISSUES_KEY, userId);
        const current = await readJson<T>(localKey, []);
        const next = current.some((item) => itemId(item) === savedId) ? current : [value, ...current];
        await AsyncStorage.setItem(localKey, JSON.stringify(next));
        return;
      }
      throw storageError('Saving issue', error.message);
    }
    return;
  }

  const current = await getSavedIssues<T>();
  const items = current.some((item) => itemId(item) === savedId)
    ? current
    : [value, ...current];

  await AsyncStorage.setItem(SAVED_ISSUES_KEY, JSON.stringify(items));
}

export async function removeSavedIssue<T>(matcher: (value: T) => boolean): Promise<void> {
  const current = await getSavedIssues<T>();
  const removedIds = current.filter(matcher).map(issueId).filter((id): id is string => Boolean(id));
  const userId = await getUserId();
  if (userId && supabase) {
    if (removedIds.length === 0) {
      return;
    }
    const { error } = await supabase
      .from('saved_issues')
      .delete()
      .eq('user_id', userId)
      .in('issue_id', removedIds);
    if (error) {
      if (isMissingTable(error, 'saved_issues')) {
        const localKey = userStorageKey(SAVED_ISSUES_KEY, userId);
        await AsyncStorage.setItem(localKey, JSON.stringify(current.filter((item) => !matcher(item))));
        return;
      }
      throw storageError('Removing saved issue', error.message);
    }
    return;
  }

  const next = current.filter((item) => !matcher(item));
  await AsyncStorage.setItem(SAVED_ISSUES_KEY, JSON.stringify(next));
}

export async function getSavedDrafts<T>(): Promise<T[]> {
  const userId = await getUserId();
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('advocacy_drafts')
      .select('client_id, title, content, issue_id, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      throw storageError('Loading drafts', error.message);
    }

    return (data ?? []).flatMap((row) => {
      try {
        const parsed = JSON.parse(row.content) as Record<string, unknown>;
        return [{ ...parsed, id: row.client_id } as T];
      } catch {
        return [{ id: row.client_id, subject: row.title, body: row.content, updatedAt: row.updated_at } as T];
      }
    });
  }
  return readJson<T>(SAVED_DRAFTS_KEY, []);
}

export async function saveDraft<T>(value: T): Promise<void> {
  const userId = await getUserId();
  const id = itemId(value);
  if (userId && supabase) {
    if (!id) {
      throw new Error('Cannot save this draft because it has no stable ID.');
    }
    const { error } = await supabase
      .from('advocacy_drafts')
      .upsert(draftFields(value, userId, id), { onConflict: 'user_id,client_id' });
    if (error) {
      throw storageError('Saving draft', error.message);
    }
    return;
  }

  const current = await getSavedDrafts<T>();
  const items = [value, ...current.filter((item) => itemId(item) !== id)];
  await AsyncStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(items));
}

export async function updateDraft<T>(value: T): Promise<void> {
  const userId = await getUserId();
  const id = itemId(value);
  if (!id) {
    throw new Error('Cannot update this draft because it has no stable ID.');
  }

  if (userId && supabase) {
    const draft = draftFields(value, userId, id);
    const { data, error } = await supabase
      .from('advocacy_drafts')
      .update({
        title: draft.title,
        issue_id: draft.issue_id,
        content: draft.content,
        updated_at: draft.updated_at,
      })
      .eq('user_id', userId)
      .eq('client_id', id)
      .select('client_id')
      .maybeSingle();
    if (error) {
      throw storageError('Updating draft', error.message);
    }
    if (!data) {
      throw storageError('Updating draft', 'The draft no longer exists in this account.');
    }
    return;
  }

  const current = await getSavedDrafts<T>();
  if (!current.some((draft) => itemId(draft) === id)) {
    throw new Error('Could not find this local draft to update.');
  }
  await AsyncStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify([value, ...current.filter((draft) => itemId(draft) !== id)]));
}

export async function removeDraft<T>(matcher: (value: T) => boolean): Promise<void> {
  const current = await getSavedDrafts<T>();
  const removedIds = current.filter(matcher).map(itemId).filter((id): id is string => Boolean(id));
  const userId = await getUserId();
  if (userId && supabase) {
    if (removedIds.length === 0) {
      return;
    }
    const { error } = await supabase
      .from('advocacy_drafts')
      .delete()
      .eq('user_id', userId)
      .in('client_id', removedIds);
    if (error) {
      throw storageError('Deleting draft', error.message);
    }
    return;
  }

  const next = current.filter((item) => !matcher(item));
  await AsyncStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(next));
}

export async function syncLocalDataToCloud(): Promise<{ issuesImported: number; draftsImported: number }> {
  const userId = await getUserId();
  if (!userId || !supabase) {
    return { issuesImported: 0, draftsImported: 0 };
  }

  const localIssues = await readJson<{ id: string }>(SAVED_ISSUES_KEY, []);
  const localDrafts = await readJson<Record<string, unknown> & { id: string }>(SAVED_DRAFTS_KEY, []);
  if (localIssues.length === 0 && localDrafts.length === 0) {
    return { issuesImported: 0, draftsImported: 0 };
  }

  if (localIssues.some((item) => !item.id) || localDrafts.some((draft) => !draft.id)) {
    throw storageError('Importing local data', 'A local record is missing its stable ID. Local copies were retained.');
  }

  const issueIds = [...new Set(localIssues.map((item) => item.id))];
  if (issueIds.length > 0) {
    const { error } = await supabase
      .from('saved_issues')
      .upsert(issueIds.map((savedId) => ({ user_id: userId, issue_id: savedId })), {
        onConflict: 'user_id,issue_id',
        ignoreDuplicates: true,
      });
    if (error) {
      if (isMissingTable(error, 'saved_issues')) {
        await moveLegacyIssuesToAccount(userId);
        return { issuesImported: 0, draftsImported: 0 };
      }
      throw syncStorageError('Importing saved issues', error.message);
    }
  }

  const { data: existingDrafts, error: listError } = await supabase
    .from('advocacy_drafts')
    .select('client_id, content')
    .eq('user_id', userId);
  if (listError) {
    throw syncStorageError('Checking cloud drafts before import', listError.message);
  }

  const existingById = new Map((existingDrafts ?? []).map((row) => [row.client_id, row.content]));
  const seenDrafts = new Set<string>();
  const draftsToImport: DraftRow[] = [];
  for (const draft of localDrafts) {
    const originalId = draft.id;
    const content = JSON.stringify(draft);
    const fingerprint = `${originalId}:${content}`;
    if (seenDrafts.has(fingerprint)) {
      continue;
    }
    seenDrafts.add(fingerprint);

    const cloudExistingContent = existingById.get(originalId);
    const hasConflict = cloudExistingContent !== undefined && cloudExistingContent !== content;
    const clientId = hasConflict ? `local-import-${hashText(`${originalId}:${content}`)}` : originalId;
    const existingImportContent = existingById.get(clientId);
    if (existingImportContent !== undefined && existingImportContent !== content) {
      throw syncStorageError('Importing local drafts', 'A draft ID conflict could not be resolved automatically. Local copies were retained.');
    }

    existingById.set(clientId, content);
    draftsToImport.push(draftFields(draft, userId, clientId));
  }

  if (draftsToImport.length > 0) {
    const { error } = await supabase
      .from('advocacy_drafts')
      .upsert(draftsToImport, { onConflict: 'user_id,client_id', ignoreDuplicates: true });
    if (error) {
      throw syncStorageError('Importing local drafts', error.message);
    }
  }

  const [issueVerification, draftVerification] = await Promise.all([
    issueIds.length > 0
      ? supabase.from('saved_issues').select('issue_id').eq('user_id', userId).in('issue_id', issueIds)
      : Promise.resolve({ data: [], error: null }),
    draftsToImport.length > 0
      ? supabase.from('advocacy_drafts').select('client_id, content').eq('user_id', userId).in('client_id', draftsToImport.map((draft) => draft.client_id))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const { data: verifiedIssues, error: verifyIssuesError } = issueVerification;
  const { data: verifiedDrafts, error: verifyDraftsError } = draftVerification;
  if (verifyIssuesError || verifyDraftsError) {
    throw syncStorageError('Verifying imported data', verifyIssuesError?.message || verifyDraftsError?.message || 'Verification failed.');
  }
  const verifiedDraftContent = new Map((verifiedDrafts ?? []).map((draft) => [draft.client_id, draft.content]));
  const draftsVerified = draftsToImport.every((draft) => verifiedDraftContent.get(draft.client_id) === draft.content);
  if ((verifiedIssues ?? []).length !== issueIds.length || !draftsVerified) {
    throw syncStorageError('Verifying imported data', 'Some records have not been confirmed in your account.');
  }

  await AsyncStorage.removeItem(SAVED_ISSUES_KEY);
  await AsyncStorage.removeItem(SAVED_DRAFTS_KEY);
  return { issuesImported: issueIds.length, draftsImported: draftsToImport.length };
}
