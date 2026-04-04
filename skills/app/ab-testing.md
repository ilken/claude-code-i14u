# A/B Testing

Our A/B testing is built on top of Statsig as our experiments provider.

## Statsig Experiments

- Use the `useABTest` hook from `ABTest.provider.tsx` for all experiment implementations
- Follow the established patterns in `src/providers/ab-test/ABTest.provider.tsx`
- All experiment methods should be added to the ABTest provider following the naming convention: `get{ExperimentName}Experiment`
- All experiment calls to the Statsig SDK client should happen within the ABTest provider
- Use `useCallback` for experiment getter functions to ensure stable references
- Always return `ExperimentBaseData` & additional experiment-specific data
- Always provide default values when calling `experiment.get()`

## Experiment Method Structure

```typescript
const get{ExperimentName}Experiment = useCallback(
  (defaultValue: Type): ExperimentBaseData & { parameterName: Type } => {
    const experiment = statsigClient.getExperiment("experiment_name");

    return {
      ...getBaseExperimentData(experiment),
      parameterName: experiment.get("parameter_key", defaultValue),
    };
  },
  [statsigClient, getBaseExperimentData],
);
```

## Base Experiment Data

The `getBaseExperimentData` helper provides common experiment metadata:

- `name`: Experiment name
- `isExperimentActive`: Whether the experiment is currently active
- `isUserInExperiment`: Whether the current user is enrolled
- `userGroup`: The group/variant the user is assigned to

## Usage Pattern

```typescript
const { getExampleRequestExperiment } = useABTest();
const exampleRequestsExperiment = getExampleRequestExperiment(defaultValue);
```

## User Management

The ABTest provider also provides:

- `updateUser(userId: string, email?: string)`: Update the current user for experiment targeting
- `forgetUser()`: Clear the current user data

## Types

- Export experiment-specific types in `src/providers/ab-test/ABTest.types.ts` when needed
- Use descriptive parameter names that clearly indicate the experiment's purpose

## Experiment Creation Workflow

1. **Create the experiment in Statsig** -- define ID, name, description, hypothesis, test groups with parameter values, metrics, and allocation percentages (typically 50/50)
2. **Update the ABTest provider** -- add `get{ExperimentName}Experiment` method following the pattern, update context value and types
3. **Implement in the UI** -- use `useABTest` hook, apply parameter values, provide default values
4. **Test and validate** -- verify experiment works, check fallbacks when inactive, ensure proper TypeScript typing

## Rules

- Use Experiments (not Dynamic Configs) for A/B testing with parameter values
- Each group should have a `parameterValues` object with experiment parameters
- Configure primary and secondary metrics
