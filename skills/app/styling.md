# Styling (React Native / Expo)

---

## Core Approach

Use a **theme-based system** with constants files for all design values. Never hardcode colors, spacing, or typography inline.

---

## Colors

Define a semantic color system in `constants/colors.constants.ts`:

```typescript
export const Colors = {
  // Brand
  primary: '#0066FF',
  primaryMuted: '#0066FF1A',
  secondary: '#FF6B00',

  // Surfaces
  backgroundBase: '#FFFFFF',
  backgroundElevated: '#F5F5F5',
  backgroundOverlay: '#0000004D',

  // Text
  textPrimary: '#0A0A0A',
  textSecondary: '#5C5C5C',
  textMuted: '#9E9E9E',
  textInverse: '#FFFFFF',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Borders
  borderDefault: '#E0E0E0',
  borderStrong: '#BDBDBD',

  // Dark mode equivalents (if supporting dark mode)
  dark: {
    backgroundBase: '#0A0A0A',
    backgroundElevated: '#141414',
    textPrimary: '#F0F0F0',
    textSecondary: '#A0A0A0',
    borderDefault: '#2A2A2A',
  },
} as const;
```

**Rules:**
- Always import from `Colors` — never hardcode `'#FFFFFF'` or `'rgba(...)'`
- Use the theme hook if dark mode is supported: `const { colors } = useTheme()`
- For opacity variations, use `Colors.primary + '1A'` (hex opacity) or `rgba` with a constant

---

## Spacing

Define a 4px grid in `constants/spacing.constants.ts`:

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// Semantic aliases
export const Layout = {
  screenHorizontalPadding: Spacing.base,
  cardPadding: Spacing.md,
  itemGap: Spacing.sm,
  sectionGap: Spacing.xl,
} as const;
```

---

## Typography

Define a scale in `constants/typography.constants.ts`:

```typescript
import { TextStyle } from 'react-native';

export const FontFamily = {
  // Replace with your actual font names (loaded via expo-font)
  display: 'YourDisplayFont-Bold',
  bodyRegular: 'YourBodyFont-Regular',
  bodyMedium: 'YourBodyFont-Medium',
  bodySemiBold: 'YourBodyFont-SemiBold',
  mono: 'YourMonoFont-Regular',
} as const;

export const Typography = {
  display1:  { fontFamily: FontFamily.display, fontSize: 48, lineHeight: 56 } as TextStyle,
  display2:  { fontFamily: FontFamily.display, fontSize: 36, lineHeight: 44 } as TextStyle,
  heading1:  { fontFamily: FontFamily.bodySemiBold, fontSize: 28, lineHeight: 36 } as TextStyle,
  heading2:  { fontFamily: FontFamily.bodySemiBold, fontSize: 22, lineHeight: 30 } as TextStyle,
  heading3:  { fontFamily: FontFamily.bodySemiBold, fontSize: 18, lineHeight: 26 } as TextStyle,
  bodyLarge: { fontFamily: FontFamily.bodyRegular,  fontSize: 16, lineHeight: 24 } as TextStyle,
  body:      { fontFamily: FontFamily.bodyRegular,  fontSize: 14, lineHeight: 22 } as TextStyle,
  bodySmall: { fontFamily: FontFamily.bodyRegular,  fontSize: 12, lineHeight: 18 } as TextStyle,
  caption:   { fontFamily: FontFamily.bodyMedium,   fontSize: 11, lineHeight: 16 } as TextStyle,
  label:     { fontFamily: FontFamily.bodySemiBold, fontSize: 13, lineHeight: 18 } as TextStyle,
} as const;
```

---

## StyleSheet Patterns

Always use `StyleSheet.create` — never inline style objects:

```typescript
// ✅
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBase,
    paddingHorizontal: Layout.screenHorizontalPadding,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
});

// ❌ inline — creates new objects on every render, breaks React.memo
<View style={{ flex: 1, padding: 16 }} />
```

**Dynamic styles** — memoize if based on props/state:

```typescript
const dynamicStyle = useMemo(
  () => StyleSheet.flatten([styles.base, isSelected && styles.selected]),
  [isSelected],
);
```

---

## Border Radius

Always add `borderCurve: 'continuous'` alongside `borderRadius` for smooth iOS squircles:

```typescript
card: {
  borderRadius: 12,
  borderCurve: 'continuous',  // iOS-specific, ignored on Android
},
```

---

## Localization (i18n)

Use `expo-localization` + `i18next` (or `react-native-i18n`). Never hardcode strings.

```typescript
// lib/i18n.ts
import i18n from 'i18next';

export const t = (key: string, options?: object) => i18n.t(key, options);

// In components — use a hook
const { t } = useTranslation();
<Text>{t('profile.editTitle')}</Text>
```

Translation files in `assets/locales/en.json`:
```json
{
  "profile": {
    "editTitle": "Edit Profile",
    "saveCta": "Save Changes"
  }
}
```

**Rules:**
- All user-visible strings go through i18n
- Use hierarchical keys: `"feature.component.element"`
- Never pass raw strings to `<Text>` — always `{t('key')}`
