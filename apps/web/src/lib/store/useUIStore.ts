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
  errorModal: { isOpen: boolean; title?: string; message?: string } | null;
  showErrorModal: (title: string, message: string) => void;
  hideErrorModal: () => void;
  selectedCenterIds: string[];
  setSelectedCenterIds: (ids: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toastMessage: null,
  toastType: null,
  showToast: (message, type = 'success') => {
    // Si c'est une erreur de quota, on intercepte pour afficher la modale globale
    if (type === 'error' && message.toLowerCase().includes('quota atteint')) {
      set({ errorModal: { isOpen: true, title: 'Action requise', message } });
    } else {
      set({ toastMessage: message, toastType: type });
    }
  },
  hideToast: () => set({ toastMessage: null, toastType: null }),
  errorModal: null,
  showErrorModal: (title, message) => set({ errorModal: { isOpen: true, title, message } }),
  hideErrorModal: () => set({ errorModal: null }),
  selectedCenterIds: [],
  setSelectedCenterIds: (ids) => set({ selectedCenterIds: ids }),
}));
