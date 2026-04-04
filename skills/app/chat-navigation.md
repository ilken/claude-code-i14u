# Chat & Real-time Messaging (React Native)

Generic patterns for adding chat to a React Native / Expo app using Stream Chat (stream-chat-expo) or similar.

---

## Stream Chat Setup

```bash
npx expo install stream-chat-expo stream-chat-react-native
```

```typescript
// lib/chat-client.ts
import { StreamChat } from 'stream-chat';

export const chatClient = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_KEY!);

// Connect user (call after authentication)
export const connectChatUser = async (userId: string, token: string) => {
  await chatClient.connectUser(
    { id: userId, name: displayName, image: avatarUrl },
    token, // generate server-side with chatClient.createToken(userId)
  );
};

export const disconnectChatUser = () => chatClient.disconnectUser();
```

---

## Navigation Hooks Pattern

Abstract all chat navigation behind custom hooks — never call `navigation.navigate` directly for chat screens in components.

```typescript
// hooks/chat/useNavigateToDM.hook.ts
export const useNavigateToDM = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return useCallback(async (recipientId: string): Promise<void> => {
    try {
      // Get or create DM channel
      const channel = chatClient.channel('messaging', {
        members: [currentUserId, recipientId],
      });
      await channel.watch();

      navigation.navigate('ChatChannel', { channelId: channel.id! });
    } catch (error) {
      console.error('Failed to navigate to DM', error);
    }
  }, [navigation]);
};
```

```typescript
// Usage in a component
const navigateToDM = useNavigateToDM();

<Button onPress={() => navigateToDM(user.id)} title="Message" />
```

---

## Channel List Screen

```typescript
import { ChannelList, ChannelPreviewMessenger } from 'stream-chat-expo';

export const InboxScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ChannelList
      filters={{ members: { $in: [currentUserId] }, type: 'messaging' }}
      sort={{ last_message_at: -1 }}
      onSelect={(channel) => {
        navigation.navigate('ChatChannel', { channelId: channel.id! });
      }}
      Preview={ChannelPreviewMessenger}
    />
  );
};
```

---

## Chat Channel Screen

```typescript
import { Channel, MessageList, MessageInput } from 'stream-chat-expo';

export const ChatChannelScreen = ({ route }: ChatChannelScreenProps) => {
  const { channelId } = route.params;
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    const ch = chatClient.channel('messaging', channelId);
    ch.watch().then(() => setChannel(ch));
  }, [channelId]);

  if (!channel) return <ActivityIndicator />;

  return (
    <Channel channel={channel} keyboardVerticalOffset={...}>
      <MessageList />
      <MessageInput />
    </Channel>
  );
};
```

---

## Event Handling Patterns

Listen to Stream events in a `useEffect`:

```typescript
useEffect(() => {
  const unsubscribe = chatClient.on('notification.message_new', (event) => {
    // Update unread badge, show notification, etc.
    updateUnreadCount(event.total_unread_count ?? 0);
  });

  return () => unsubscribe.unsubscribe();
}, []);
```

Common events:
| Event | When it fires |
|-------|--------------|
| `message.new` | New message in a watched channel |
| `notification.message_new` | New message in a non-watched channel |
| `channel.hidden` | Channel was hidden (user "deleted" DM) |
| `channel.deleted` | Channel was hard-deleted server-side |
| `member.added` | User added to channel |

**Important:** `channel.hidden` ≠ `channel.deleted`. "Delete chat" usually hides, not deletes.

---

## Unread Counts

```typescript
// Show unread badge on tab bar
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const handleEvent = (event: Event) => {
    setUnreadCount(event.total_unread_count ?? 0);
  };

  chatClient.on('notification.mark_read', handleEvent);
  chatClient.on('notification.message_new', handleEvent);

  return () => {
    chatClient.off('notification.mark_read', handleEvent);
    chatClient.off('notification.message_new', handleEvent);
  };
}, []);
```

---

## Rules

- **Navigation hooks only** — never call `navigation.navigate('Chat...')` directly in components
- **Error handling is required** — channel `watch()` can fail (offline, permission denied)
- **Always `unsubscribe`** from event listeners in useEffect cleanup
- **`channel.hidden` ≠ `channel.deleted`** — handle both events distinctly
- **Server-side token generation** — never generate Stream tokens client-side
