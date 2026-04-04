# Navigation (Expo Router / React Navigation)

Generic navigation patterns for Expo + React Navigation apps.

---

## Expo Router (Recommended for New Projects)

File-based routing — screens map to files under `app/`.

```
app/
├── _layout.tsx           # Root layout (providers, navigation container)
├── index.tsx             # / (home)
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator
│   ├── feed.tsx          # /feed
│   └── profile.tsx       # /profile
├── profile/
│   └── [userId].tsx      # /profile/:userId
└── settings.tsx          # /settings
```

### Navigation in Expo Router

```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Navigate
router.push('/profile/123');
router.replace('/login');
router.back();

// Typed params
const { userId } = useLocalSearchParams<{ userId: string }>();
```

---

## React Navigation (Classic Setup)

Use when not on Expo Router or for more complex navigator nesting.

### Navigator types
- `createNativeStackNavigator` — native iOS/Android transitions, best performance
- `createBottomTabNavigator` — bottom tab bar
- `createDrawerNavigator` — side drawer
- `createMaterialTopTabNavigator` — swipeable tabs

### Type-safe navigation

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  Modal: { title: string; message: string };
};

export type TabParamList = {
  Feed: undefined;
  Search: undefined;
  Inbox: { unread?: number };
};

// Type for use in screen components
type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
```

### Navigator setup

```typescript
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="Modal"
      component={ModalScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);
```

### Screen props pattern

```typescript
type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params;

  // Set header options with useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({ title: user?.name ?? 'Profile' });
  }, [navigation, user?.name]);
};
```

---

## Deep Linking

Configure in `app.json` (Expo) or `AndroidManifest.xml` / `Info.plist`:

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": { "bundler": "metro" }
  }
}
```

```typescript
// navigation/linking.ts
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Profile: 'profile/:userId',
      Settings: 'settings',
    },
  },
};
```

---

## Navigation Hooks

```typescript
// Custom hook to encapsulate navigation actions — keeps screens clean
export const useProfileNavigation = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const goToProfile = useCallback((userId: string) => {
    navigation.navigate('Profile', { userId });
  }, [navigation]);

  const goToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return { goToProfile, goToSettings };
};
```

---

## Modals & Sheets

Use `presentation: 'modal'` for modal stacks:

```typescript
<Stack.Screen
  name="EditProfile"
  component={EditProfileScreen}
  options={{ presentation: 'modal', gestureEnabled: true }}
/>
```

For bottom sheets, prefer **@gorhom/bottom-sheet**:

```typescript
import BottomSheet from '@gorhom/bottom-sheet';

const bottomSheetRef = useRef<BottomSheet>(null);
const snapPoints = useMemo(() => ['50%', '90%'], []);

<BottomSheet ref={bottomSheetRef} snapPoints={snapPoints} enablePanDownToClose>
  <SheetContent />
</BottomSheet>
```

---

## Rules

- **Always type your navigators** — `RootStackParamList`, `TabParamList`, etc.
- **Use `useLayoutEffect` for navigation options** — `useEffect` causes a visible flash
- **Extract navigation logic to hooks** — keep screen components clean
- **Use `navigation.replace` for auth flows** — prevents back-navigation to login
- **Never hardcode route names** — define them in `navigation/routes.constants.ts`
