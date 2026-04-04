# A/B Testing (React Native / Expo)

Generic A/B testing patterns. Examples use Statsig but the approach works with any provider (PostHog, LaunchDarkly, Growthbook).

---

## Pattern: ABTest Provider

Centralize all experiment access in a single provider. Components never call the SDK directly.

```typescript
// providers/ab-test/ABTest.context.tsx
export type ABTestContextProps = {
  getOnboardingVariant: () => 'control' | 'variant_a' | 'variant_b';
  getPaywallLayout: (defaultValue: string) => string;
};

export const ABTestContext = createContext<ABTestContextProps | null>(null);
```

```typescript
// providers/ab-test/ABTest.provider.tsx
export const ABTestProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  // Initialize your SDK client here (Statsig, PostHog, etc.)
  const client = useExperimentClient();

  const getOnboardingVariant = useCallback((): 'control' | 'variant_a' | 'variant_b' => {
    const experiment = client.getExperiment('onboarding_flow');
    return experiment.get('variant', 'control');
  }, [client]);

  const getPaywallLayout = useCallback((defaultValue: string): string => {
    const experiment = client.getExperiment('paywall_layout');
    return experiment.get('layout', defaultValue);
  }, [client]);

  const value = useMemo(() => ({
    getOnboardingVariant,
    getPaywallLayout,
  }), [getOnboardingVariant, getPaywallLayout]);

  return <ABTestContext.Provider value={value}>{children}</ABTestContext.Provider>;
});
```

```typescript
// providers/ab-test/useABTest.hook.ts
export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (!context) throw new Error('useABTest must be within ABTestProvider');
  return context;
};
```

---

## Statsig Setup (if using Statsig)

```typescript
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-native-bindings';

export const ABTestProvider = ({ children }: PropsWithChildren) => {
  const { client } = useClientAsyncInit(process.env.EXPO_PUBLIC_STATSIG_KEY!, {
    userID: currentUser.id,
    email: currentUser.email,
  });

  // ... wrap with StatsigProvider
};
```

### Experiment getter pattern (Statsig)

```typescript
const get{ExperimentName}Experiment = useCallback(
  (defaultValue: ExperimentValueType) => {
    const experiment = statsigClient.getExperiment('experiment_key');
    return {
      isActive: experiment.getExperimentValue('__active', false),
      isInGroup: experiment.getExperimentValue('__inExperiment', false),
      group: experiment.getGroupName() ?? 'control',
      parameterName: experiment.get('parameter_key', defaultValue),
    };
  },
  [statsigClient],
);
```

---

## Usage in Components

```typescript
const MyScreen = () => {
  const { getOnboardingVariant } = useABTest();
  const variant = getOnboardingVariant();

  if (variant === 'variant_a') return <OnboardingV2 />;
  if (variant === 'variant_b') return <OnboardingV3 />;
  return <OnboardingV1 />;
};
```

---

## Experiment Workflow

1. **Create experiment in your provider dashboard** — define variants, allocation %, metrics
2. **Add getter to `ABTestProvider`** — `get{ExperimentName}Experiment`, following the pattern
3. **Update context type and value** — add the new getter
4. **Implement in UI** — use `useABTest()`, handle all variants including `'control'`
5. **Provide default values** — always handle the case where the SDK hasn't loaded

---

## Rules

- **All SDK calls inside the ABTest provider** — never call experiment SDKs directly in components
- **Always provide fallback/default values** — SDK might not be ready on first render
- **Use `useCallback` for getters** — stable references matter for memoized components
- **Name experiments consistently**: `snake_case` for experiment keys, matching names in the dashboard
- **Test with experiments disabled** — ensure the default/control experience works without the SDK
