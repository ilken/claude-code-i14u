# Design to Code (React Native / Expo)

Workflow for implementing designs accurately without a Figma MCP.

---

## Workflow

### 1. Get a Screenshot or Spec

Ask the user to:
- Paste a screenshot directly into the conversation
- Share specific measurements (spacing, font sizes, colors in hex)
- Export assets from Figma as PNG/SVG

Claude can read images directly — paste them into the chat.

### 2. Extract Design Values

When analyzing a design screenshot, look for:

| Property | What to check |
|----------|--------------|
| Spacing | Gap between elements — map to nearest `Spacing.*` constant |
| Colors | Hex values — map to nearest `Colors.*` constant or add a new token |
| Typography | Font size, weight, line height — map to `Typography.*` scale |
| Border radius | Pixel value + always add `borderCurve: 'continuous'` |
| Shadows | iOS shadow props or Android elevation |
| Icons | Identify the icon name — use Expo Vector Icons or Lucide |

### 3. Map to Design System Tokens

Always use constants rather than raw values:

```typescript
// ❌ hardcoded
<View style={{ padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12 }} />

// ✅ token-mapped
<View style={[styles.card]}>

// styles
card: {
  padding: Spacing.base,             // 16
  backgroundColor: Colors.backgroundElevated,
  borderRadius: 12,
  borderCurve: 'continuous',
}
```

### 4. Flag Missing Tokens

If a design value doesn't have a matching token, flag it:

> "The design uses `#7C3AED` which isn't in `Colors`. Should I add `Colors.purple` or use the closest existing token (`Colors.primary`)?"

---

## Common Patterns

### Card
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3, // Android
  },
});
```

### Avatar
```typescript
avatar: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: Colors.backgroundElevated, // placeholder while loading
}
```

### Divider
```typescript
divider: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: Colors.borderDefault,
  marginVertical: Spacing.sm,
}
```

### Pill / Badge
```typescript
badge: {
  paddingHorizontal: Spacing.sm,
  paddingVertical: 3,
  borderRadius: 100,
  backgroundColor: Colors.primaryMuted,
}
```

---

## Icons

Use **Expo Vector Icons** (built into Expo SDK):

```typescript
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

<Ionicons name="heart-outline" size={24} color={Colors.textPrimary} />
```

Or **Lucide React Native** for more modern icons:

```bash
npm install lucide-react-native
```

```typescript
import { Heart, Settings, ChevronRight } from 'lucide-react-native';

<Heart size={24} color={Colors.textPrimary} strokeWidth={1.5} />
```

---

## Responsive Sizing

Use `useWindowDimensions()` for responsive layouts:

```typescript
const { width, height } = useWindowDimensions();
const cardWidth = width - Layout.screenHorizontalPadding * 2;
```

Use `PixelRatio` for hairline borders:

```typescript
import { StyleSheet } from 'react-native';
// StyleSheet.hairlineWidth is 1px in device pixels (0.5 on 2x screens)
borderWidth: StyleSheet.hairlineWidth,
```
