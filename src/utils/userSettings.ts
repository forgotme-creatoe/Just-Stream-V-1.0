export interface UserSettings {
  displayName: string;
  email: string;
  autoplay: boolean;
  highQuality: boolean;
  notifyNewEpisodes: boolean;
  notifyRecommendations: boolean;
  notifyAccountUpdates: boolean;
  notifyMarketing: boolean;
  dataCollection: boolean;
  incognitoMode: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Guest',
  email: '',
  autoplay: true,
  highQuality: true,
  notifyNewEpisodes: true,
  notifyRecommendations: true,
  notifyAccountUpdates: true,
  notifyMarketing: false,
  dataCollection: true,
  incognitoMode: false,
};

const SETTINGS_KEY = 'ais_user_settings';

export function getUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveUserSettings(settings: Partial<UserSettings>) {
  const current = getUserSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('userSettingsChanged'));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
