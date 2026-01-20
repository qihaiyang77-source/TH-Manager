import { Task, Member, Group } from '../types';
import { INITIAL_TASKS, MOCK_MEMBERS, MOCK_GROUPS } from '../constants';

// Use relative path to leverage Vite proxy in dev and same-origin in prod
const API_BASE = '/api';
const STORAGE_KEY = 'taskpulse_data_cache';

export interface AppData {
  tasks: Task[];
  members: Member[];
  groups: Group[];
}

export interface SaveResult {
  success: boolean;
  mode: 'server' | 'local';
}

const getDefaultData = (): AppData => ({
  tasks: INITIAL_TASKS,
  members: MOCK_MEMBERS,
  groups: MOCK_GROUPS
});

// --- Configuration API ---

export const getConfig = async () => {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    return await res.json();
  } catch (error) {
    // Fail silently for config fetch if server is down, SettingsModal will handle defaults
    console.debug('Config fetch failed:', error);
    return {};
  }
};

export const saveConfig = async (config: any) => {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save config');
  return await res.json();
};

export const initDb = async () => {
  const res = await fetch(`${API_BASE}/init`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Init failed');
  return data;
};

// --- Data API ---

// Special check to see if DB is actually usable
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (res.status === 503) {
      // 503 usually means configured but failed to connect, or not configured
      const data = await res.json();
      if (data.error === 'DB_NOT_CONFIGURED') return false; 
    }
    return res.ok;
  } catch {
    return false;
  }
};

export const fetchData = async (): Promise<AppData> => {
  try {
    const response = await fetch(`${API_BASE}/data`);
    
    // Check for specific backend errors
    if (response.status === 503) {
      const err = await response.json();
      throw new Error(err.error); // E.g. "DB_NOT_CONFIGURED"
    }

    if (!response.ok) {
      throw new Error('Server response not ok');
    }
    const data = await response.json();
    
    // Update local cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;

  } catch (error: any) {
    // Propagate configuration errors so UI can show Settings modal
    if (error.message === 'DB_NOT_CONFIGURED') {
      throw error;
    }

    console.warn('Data fetch warning (using local fallback):', error.message);
    
    // Fallback to local storage for other errors (like network down)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    
    return getDefaultData();
  }
};

export const saveData = async (data: AppData): Promise<SaveResult> => {
  // Always save to local cache
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}

  try {
    const response = await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // If DB not configured, this might 500 or 404, consider it local mode
      return { success: false, mode: 'local' };
    }

    return { success: true, mode: 'server' };
  } catch (error) {
    return { success: true, mode: 'local' };
  }
};