import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVED_ARTICLES_KEY = 'voice-pulse:saved-articles';
export const SAVED_DRAFTS_KEY = 'voice-pulse:saved-drafts';
export const SAVED_ISSUES_KEY = 'voice-pulse:saved-issues';

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
  return readJson<T>(SAVED_ISSUES_KEY, []);
}

export async function saveIssue<T>(value: T): Promise<void> {
  const current = await getSavedIssues<T>();
  const items = current.some((item) => JSON.stringify(item) === JSON.stringify(value))
    ? current
    : [value, ...current];

  await AsyncStorage.setItem(SAVED_ISSUES_KEY, JSON.stringify(items));
}

export async function removeSavedIssue<T>(matcher: (value: T) => boolean): Promise<void> {
  const current = await getSavedIssues<T>();
  const next = current.filter((item) => !matcher(item));
  await AsyncStorage.setItem(SAVED_ISSUES_KEY, JSON.stringify(next));
}

export async function getSavedDrafts<T>(): Promise<T[]> {
  return readJson<T>(SAVED_DRAFTS_KEY, []);
}

export async function saveDraft<T>(value: T): Promise<void> {
  const current = await getSavedDrafts<T>();
  const items = [value, ...current];
  await AsyncStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(items));
}

export async function removeDraft<T>(matcher: (value: T) => boolean): Promise<void> {
  const current = await getSavedDrafts<T>();
  const next = current.filter((item) => !matcher(item));
  await AsyncStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(next));
}
