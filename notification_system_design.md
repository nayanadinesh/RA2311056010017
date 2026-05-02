# Stage 1

## Priority Inbox Approach

The Stage 1 backend builds a Priority Inbox for campus notifications. The goal is to show the top 10 most important unread notifications first.

Each notification has a type, message, timestamp, and ID. The priority score is calculated using both the notification type and the notification time.

```text
score = (type_weight * 1,000,000,000) + unix_timestamp
```

After calculating the score for every notification, the backend sorts all notifications in descending order. The first 10 notifications after sorting are displayed in the console.

## Type Weight and Recency

Different notification types have different importance levels:

```text
Placement = 3
Result = 2
Event = 1
```

Placement notifications are most important because they are related to jobs and career opportunities. Result notifications come next because students need academic updates quickly. Event notifications are still useful, but they have the lowest priority among the three types.

The timestamp is converted into a Unix timestamp. A newer notification has a larger Unix timestamp, so it gets a higher score when the type is the same.

This means:

- Placement notifications appear before Result and Event notifications.
- Result notifications appear before Event notifications.
- If two notifications have the same type, the newer one appears first.

## Using a Min-Heap for Incoming Notifications

For a small number of notifications, sorting the full list is simple and easy to understand. But if many notifications keep coming in real time, sorting the whole list every time can become slow.

A min-heap can be used to keep only the top 10 notifications efficiently.

The idea is:

1. Calculate the priority score for every new notification.
2. Add notifications into a min-heap.
3. Keep the heap size limited to 10.
4. If the heap has more than 10 notifications, remove the notification with the lowest priority score.

Because the smallest score is always at the top of the min-heap, it is easy to remove the least important notification. This helps the system keep the best 10 notifications without sorting the full list again and again.
