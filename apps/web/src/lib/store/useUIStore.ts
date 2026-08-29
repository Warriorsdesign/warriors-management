import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toastMessage: string | null;
  toastType: 'success' | 'error' | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toastMessage: null,
  toastType: null,
  showToast: (message, type = 'success') => set({ toastMessage: message, toastType: type }),
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));
