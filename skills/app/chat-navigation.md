# Chat Navigation & Messaging Screens

## Chat Navigation Hooks

### Key Principles

- **MUST** use `useNavigatePrivateChatChannelOrRequestSafe` for private messaging
- **MUST** use `useNavigateArtistChatChannel` for artist chat rooms
- **MUST** use `useNavigateChatChannelSafe` for safe channel navigation with membership validation
- **MUST** handle errors and loading states
- **SHOULD** use appropriate navigation action (navigate vs push)

### Private Messaging

```typescript
const navigatePrivateChatChannelOrRequestSafe =
  useNavigatePrivateChatChannelOrRequestSafe();

await navigatePrivateChatChannelOrRequestSafe({
  receiverProfileId: profileId,
  onRequestLimitReached: showPaywall,
  onAgeRestricted: showAgeMismatchToast,
  requestScreenParams: { name, picture, avatarColourMix },
  onComplete: () => close(),
});
```

### Artist Chat

```typescript
const navigateArtistChatChannel = useNavigateArtistChatChannel();

await navigateArtistChatChannel({
  chatChannelExternalId: artist.chatChannelExternalId,
  action: "push",
  onError: error => logger.error("Failed to navigate:", error),
});
```

### Safe Channel Navigation

```typescript
const navigateChatChannelSafe = useNavigateChatChannelSafe();

await navigateChatChannelSafe({
  chatChannelExternalId: "channel-123",
  onAborted: () => showJoinScreen(),
  onError: error => logger.error("Navigation failed:", error),
});
```

### Tab Navigation

```typescript
const navigateChatChannelsMessages = useNavigateChatChannelsMessages();
const navigateChatChannelsRequests = useNavigateChatChannelsRequests();

navigateChatChannelsMessages();
navigateChatChannelsRequests();
```

### Error Handling

```typescript
await navigatePrivateChatChannelOrRequestSafe({
  receiverProfileId: profileId,
  onError: error => logger.error("Navigation failed", { error }),
  onRequestLimitReached: showPaywall,
  onAgeRestricted: showAgeMismatchToast,
});
```

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handlePress = useCallback(async () => {
  try {
    setIsLoading(true);
    await navigatePrivateChatChannelOrRequestSafe({
      receiverProfileId: profileId,
      onRequestLimitReached: showPaywall,
      onAgeRestricted: showAgeMismatchToast,
      onComplete: () => {
        close();
        setIsLoading(false);
      },
    });
  } finally {
    setIsLoading(false);
  }
}, [profileId, showPaywall, showAgeMismatchToast, close]);
```

## Channel Deletion / Leave Event Mapping

When a user performs a chat action, the backend fires specific Stream events:

| User action | Backend call | Stream event |
|---|---|---|
| Delete Chat (accepted DM) | `hideChannel()` | `channel.hidden` |
| Decline request (pending DM) | `rejectChannelInvite()` | varies |
| Leave chatroom | `hideChannel()` | `channel.hidden` |
| Server-side channel deletion | Stream API delete | `channel.deleted` |

**Important**: "Delete Chat" fires `channel.hidden`, NOT `channel.deleted`.

## Anti-Patterns

- Don't use `useNavigateArtistChatChannel` for private messaging
- Don't ignore error handling callbacks
- Don't use low-level hooks when high-level ones exist
- Don't forget to handle `onComplete` callback for proper cleanup
- Don't assume "Delete Chat" fires `channel.deleted` -- it fires `channel.hidden`

## Messaging Screens Consistency

### When This Applies

When editing `ChannelList` event handlers (`onNewMessage`, `onChannelDeleted`, `onChannelHidden`, `onAddedToChannel`, etc.) in any of the three messaging screens.

### The Three ChannelList Screens

Changes to ChannelList event handlers **must** be applied to all three screens:

1. **DirectMessages** -- `chat-tabs/messages/DirectMessages.screen.tsx`
2. **Chatrooms** -- `chat-tabs/messages/Chatrooms.screen.tsx`
3. **MessageRequests** -- `chat-tabs/message-requests/MessageRequests.screen.tsx`

### Checklist

- Handler type alias added/updated in `Chat.types.ts`
- Handler callback added/updated in **DirectMessages.screen.tsx**
- Handler callback added/updated in **Chatrooms.screen.tsx**
- Handler callback added/updated in **MessageRequests.screen.tsx**
- Props wired on `<ChannelList />` in all three screens
- JSDoc comments updated in all three screens

### Key Differences Between Screens

- **DirectMessages**: Uses `isDirectMessageChannel` guard, checks `member.status !== "pending"`
- **Chatrooms**: Uses `isArtistChannel` guard, no membership status check
- **MessageRequests**: Uses `isDirectMessageChannel` guard, checks `member.status === "pending"` (inverse of DirectMessages)

"Remove" handlers (e.g. `onChannelDeleted`, `onChannelHidden`) are typically identical across all three screens.
