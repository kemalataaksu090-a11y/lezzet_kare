
import { User } from '../types';

const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';
const LOGS_KEY = 'staff_activity_logs';

// Yardımcı fonksiyon: Log ekleme
const addLog = (username: string, action: 'GİRİŞ' | 'ÇIKIŞ') => {
  try {
    const logsStr = localStorage.getItem(LOGS_KEY);
    const logs = logsStr ? JSON.parse(logsStr) : [];
    
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      action,
      timestamp: Date.now()
    };

    logs.unshift(newEntry);
    
    // Performans için sadece son 100 aktiviteyi sakla
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (error) {
    console.error("Log kaydedilemedi:", error);
  }
};

export const authService = {
  // Yeni kullanıcı kaydı
  register: (user: User): boolean => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.username === user.username)) {
      return false; // Kullanıcı zaten mevcut
    }

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  // Giriş işlemi
  login: (user: User): boolean => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    const foundUser = users.find(u => u.username === user.username && u.password === user.password);
    
    if (foundUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ username: foundUser.username }));
      
      // Giriş aktivitesini logla
      addLog(foundUser.username, 'GİRİŞ');
      
      return true;
    }
    return false;
  },

  // Çıkış işlemi
  logout: () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Çıkış aktivitesini logla
      addLog(currentUser.username, 'ÇIKIŞ');
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Kimlik doğrulaması kontrolü
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(CURRENT_USER_KEY);
  },

  // Mevcut kullanıcı bilgisini getir
  getCurrentUser: (): User | null => {
    const str = localStorage.getItem(CURRENT_USER_KEY);
    return str ? JSON.parse(str) : null;
  },

  // Personel aktivite loglarını getir
  getActivityLogs: (): {username: string, action: string, timestamp: number, id: string}[] => {
    const str = localStorage.getItem(LOGS_KEY);
    return str ? JSON.parse(str) : [];
  }
};
