import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LearnerProfile, AppSettings, DomainType } from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { translations, TranslationKey } from '../constants/translations';

interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  data?: any;
}

interface AppContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerUser: (params: {
    name: string;
    email: string;
    password: string;
    role: 'learner' | 'mentor' | 'admin';
    profileType: 'Student' | 'Government Employee' | 'Private-Sector Professional';
    department?: string;
    designation?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  allUsers: User[];
  activeProfile: LearnerProfile | null;
  updateProfile: (profile: LearnerProfile) => Promise<void>;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: TranslationKey) => string;
  fontSize: 'small' | 'default' | 'large';
  setFontSize: (size: 'small' | 'default' | 'large') => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  resetDemoData: () => void;
  domainScores: Record<DomainType, number>;
  refreshScores: () => Promise<void>;
  notification: NotificationPayload | null;
  dismissNotification: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(ApiService.getToken()));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    StorageService.initStorage();
    return StorageService.getActiveUser();
  });
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [activeProfile, setActiveProfile] = useState<LearnerProfile | null>(() =>
    StorageService.getProfile(currentUser.id)
  );
  const [domainScores, setDomainScores] = useState<Record<DomainType, number>>(() =>
    StorageService.getLatestDomainScores(currentUser.id)
  );
  const [notification, setNotification] = useState<NotificationPayload | null>(null);

  // Check backend session on mount
  useEffect(() => {
    StorageService.initStorage();
    const token = ApiService.getToken();

    async function initSession() {
      if (token) {
        try {
          const { user, profile } = await ApiService.getMe();
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            if (profile) setActiveProfile(profile);
            const scores = await ApiService.getDomainScores().catch(() => null);
            if (scores) setDomainScores(scores);
          } else {
            setIsAuthenticated(false);
            ApiService.clearToken();
          }
        } catch (err) {
          console.warn('Session verification failed, logging out session:', err);
          setIsAuthenticated(false);
          ApiService.clearToken();
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setIsReady(true);
    }

    initSession();
  }, []);

  // Set up real-time Socket.io notification listener
  useEffect(() => {
    try {
      const socket = ApiService.getSocket();
      const handleNotification = (notif: NotificationPayload) => {
        console.log('[Socket] Notification received:', notif);
        setNotification(notif);
      };

      socket.on('user_notification', handleNotification);

      return () => {
        socket.off('user_notification', handleNotification);
      };
    } catch (err) {
      console.warn('Socket connection initialization deferred:', err);
    }
  }, [currentUser.id]);

  const refreshScores = useCallback(async () => {
    try {
      const scores = await ApiService.getDomainScores();
      setDomainScores(scores);
    } catch {
      setDomainScores(StorageService.getLatestDomainScores(currentUser.id));
    }
    const prof = await ApiService.getProfile().catch(() => StorageService.getProfile(currentUser.id));
    if (prof) setActiveProfile(prof);
  }, [currentUser.id]);

  // Login handler
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoadingAuth(true);
    try {
      const { user } = await ApiService.login(email, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
      StorageService.setActiveUserId(user.id);
      await refreshScores();
      return user;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Register handler
  const registerUser = async (params: {
    name: string;
    email: string;
    password: string;
    role: 'learner' | 'mentor' | 'admin';
    profileType: 'Student' | 'Government Employee' | 'Private-Sector Professional';
    department?: string;
    designation?: string;
  }): Promise<User> => {
    setIsLoadingAuth(true);
    try {
      const { user } = await ApiService.register(params);
      setCurrentUser(user);
      setIsAuthenticated(true);
      StorageService.setActiveUserId(user.id);
      await refreshScores();
      return user;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (err) {
      console.warn('Backend logout error:', err);
    } finally {
      ApiService.clearToken();
      setIsAuthenticated(false);
    }
  };

  // Switch demo user (Uses real server demo-switch token endpoint with fallback)
  const switchUser = async (userId: string) => {
    try {
      const { user } = await ApiService.demoSwitch(userId);
      setCurrentUser(user);
      setIsAuthenticated(true);
      StorageService.setActiveUserId(user.id);
      await refreshScores();
    } catch (err) {
      console.warn('Backend demo-switch unreachable, activating local switcher:', err);
      StorageService.setActiveUserId(userId);
      const user = StorageService.getUser(userId) || StorageService.getActiveUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
      setActiveProfile(StorageService.getProfile(user.id));
      setDomainScores(StorageService.getLatestDomainScores(user.id));
    }
  };

  const updateProfile = async (profile: LearnerProfile) => {
    try {
      const updated = await ApiService.updateProfile(profile);
      setActiveProfile(updated);
    } catch {
      StorageService.saveProfile(profile);
      setActiveProfile({ ...profile });
    }
  };

  const setLanguage = (lang: 'en' | 'hi') => {
    const updated = StorageService.saveSettings({ language: lang });
    setSettings(updated);
  };

  const setFontSize = (size: 'small' | 'default' | 'large') => {
    const updated = StorageService.saveSettings({ fontSize: size });
    setSettings(updated);
  };

  const setHighContrast = (val: boolean) => {
    const updated = StorageService.saveSettings({ highContrast: val });
    setSettings(updated);
  };

  const resetDemoData = () => {
    StorageService.resetAllData();
    const defaultUser = StorageService.getActiveUser();
    setCurrentUser(defaultUser);
    setActiveProfile(StorageService.getProfile(defaultUser.id));
    setDomainScores(StorageService.getLatestDomainScores(defaultUser.id));
    setSettings(StorageService.getSettings());
  };

  const dismissNotification = () => setNotification(null);

  const t = (key: TranslationKey): string => {
    const dict = translations[settings.language] || translations.en;
    return (dict as any)[key] || translations.en[key] || String(key);
  };

  // Accessibility styling
  useEffect(() => {
    const root = document.documentElement;
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (settings.fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [settings.highContrast, settings.fontSize]);

  if (!isReady) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoadingAuth,
        login,
        registerUser,
        logout,
        switchUser,
        allUsers: StorageService.getUsers(),
        activeProfile,
        updateProfile,
        language: settings.language,
        setLanguage,
        t,
        fontSize: settings.fontSize,
        setFontSize,
        highContrast: settings.highContrast,
        setHighContrast,
        resetDemoData,
        domainScores,
        refreshScores,
        notification,
        dismissNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
