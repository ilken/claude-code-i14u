# Styling & Localization

## Colors

- Import `Color` from `@constants/Color`
- Never use hardcoded color values
- Use semantic color constants
- Use opacity variations (02-95)

## Typography

- Import `FontStyles` from `@styles/Font.styles`
- Use predefined font styles: `[size][type][style]`
- Sizes: 10, 12, 14, 16, 20, 24, 32, 48
- Types: Mono, Bold, Regular
- Styles: Paragraph, Title, Button

## Spacing

- Use `SPACING_HORIZONTAL` and `SPACING_VERTICAL` constants
- Predefined values: 2, 3, 4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 34, 36, 40, 42, 44, 48, 80, 85, 100, 120

## Border Radius

- Always include `borderCurve: "continuous"` with `borderRadius` for consistent cross-platform rendering
- Use predefined border radius values from the design system

## Localization

- Add all user-facing text to `src/assets/languages/en.json`
- Use the `useLocalization` hook: `const { t } = useLocalization()`
- Use hierarchical translation keys (e.g., `"editProfile.addBirthday.title"`)
- Never hardcode text strings directly in components

```typescript
const { t } = useLocalization();
<Text>{t("editProfile.addBirthday.title")}</Text>
```
