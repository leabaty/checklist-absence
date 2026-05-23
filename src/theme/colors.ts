export const Colors = {
  // ─── Background ───────────────────────────────────────────────
  background: '#FDF6EC',
  card: '#FFFFFF',
  cardShadow: '#C4622A22',

  // ─── Accents ──────────────────────────────────────────────────
  primary: '#C4622A',
  primaryLight: '#E8845A',
  primaryPale: '#FBE8DC',

  // ─── Text ─────────────────────────────────────────────────────
  textDark: '#2D1F0E',
  textMedium: '#6B4F3A',
  textLight: '#9E856E',

  // ─── Swipe feedback ───────────────────────────────────────────
  swipeDone: '#4CAF50',
  swipeLater: '#f49836',

  // ─── Border / divider ─────────────────────────────────────────
  border: '#EAD9C8',

  // ─── Tab bar ──────────────────────────────────────────────────
  tabBar: '#FFFFFF',
  tabActive: '#C4622A',
  tabInactive: '#9E856E',

  // ─── Category pastels ─────────────────────────────────────────
  category: {
    chat: '#FFE4CC',
    plantes: '#D9F0DC',
    lessive: '#D9E8FF',
    menage: '#FFF0D9',
    cuisine: '#FFE4D9',
    salledebain: '#D9F0F7',
    poubelles: '#EDE0FF',
  } as Record<string, string>,

  categoryText: {
    chat: '#A0522D',
    plantes: '#2E7D32',
    lessive: '#1565C0',
    menage: '#E65100',
    cuisine: '#BF360C',
    salledebain: '#00838F',
    poubelles: '#6A1B9A',
  } as Record<string, string>,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 999,
};
