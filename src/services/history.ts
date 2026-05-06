import AsyncStorage from "@react-native-async-storage/async-storage";
import { SearchHistoryItem } from "../types";

const STORAGE_KEY = "canada-registry-finder:history";

export async function readHistory(): Promise<SearchHistoryItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addHistoryItem(
  item: SearchHistoryItem
): Promise<SearchHistoryItem[]> {
  const existing = await readHistory();
  const withoutDuplicate = existing.filter(
    (entry) => entry.query.toLowerCase() !== item.query.toLowerCase()
  );
  const next = [item, ...withoutDuplicate].slice(0, 20);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
