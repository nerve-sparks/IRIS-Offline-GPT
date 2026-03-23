// src/theme/irisTheme.ts
// Matches existing IRIS app color scheme exactly

export const colors = {
  // Backgrounds — from existing ChatScreen
  bg:           '#050a14',   // main background
  bgSurface:    '#171E2C',   // cards, bubbles
  bgElevated:   '#1e293b',   // header, elevated panels
  bgInput:      '#171E2C',   // input fields

  // Borders
  border:       '#334155',
  borderLight:  '#475569',

  // Text
  textPrimary:  '#f5f5f5',
  textSecondary:'#A0A0A5',
  textMuted:    '#64748b',

  // Accent — IRIS blue
  accent:       '#2563EB',
  accentSoft:   '#1e3a5f',
  accentPurple: '#7C3AED',

  // Bubbles — from existing ChatScreen
  userBubble:   '#171E2C',
  aiBubble:     'transparent',

  // Status
  online:       '#4ADE80',
  pinned:       '#F59E0B',
  starred:      '#F59E0B',

  // Danger
  danger:       '#EF4444',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40,
};

export const radius = {
  sm: 6, md: 12, lg: 16, xl: 20, full: 999,
};

export const typography = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  xxl: 28,
  xxxl: 40,
};
