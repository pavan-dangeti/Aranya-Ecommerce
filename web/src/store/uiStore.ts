import { create } from 'zustand'

interface UiState {
  cartOpen: boolean
  searchOpen: boolean
  menuOpen: boolean
  quickViewSlug: string | null
  openCart: () => void
  closeCart: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleMenu: (open?: boolean) => void
  setQuickView: (slug: string | null) => void
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  quickViewSlug: null,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleMenu: (open) => set((s) => ({ menuOpen: open ?? !s.menuOpen })),
  setQuickView: (slug) => set({ quickViewSlug: slug }),
}))
