# Notifications System

The Notifications System allows the platform to communicate important updates (e.g., new applications, interview confirmations) to users in real-time or via a persistent history.

## Architecture

### Backend
- **Module**: `NotificationsModule`
- **Data Model**: `Notification` (Prisma)
  - Fields: `id`, `userId`, `type` (INFO, WARNING, SUCCESS), `message`, `read`, `link`, `createdAt`.
- **Service**: `NotificationsService`
  - `create(userId, type, message)`: Persists a notification.
  - `findAll(userId)`: Retrieves notification history.
  - `create(userId, type, message)`: Persists a notification.
  - `findAll(userId, unreadOnly)`: Retrieves notification history.
  - `markAsRead(id, userId)`: Updates read status for a specific notification.
  - `markAllAsRead(userId)`: Updates read status for all unread notifications.

### API Endpoints
- `GET /notifications?unread=true/false`: Fetch notifications.
- `PATCH /notifications/:id/read`: Mark specific notification as read.
- `PATCH /notifications/read-all`: Mark all notifications as read.

### Frontend
- **Component**: `NotificationBell`
  - Located in the Sidebar.
  - Located in the Sidebar.
  - Polls the backend (`GET /notifications`) every minute (60s).
  - Displays a dropdown list of recent notifications.
  - Allows marking individual notifications as read (`PATCH /notifications/:id/read`), which also optionally navigates the user to the relevant link.
- **Page**: `/notifications`
  - Dedicated page for viewing full notification history.

### Notification Types
1.  **Application Assignment**: When a recruiter is assigned to an application.
2.  **Interview Booking**: When a candidate confirms a slot.
3.  **Interview Re-assignment**: When an interview is transferred.
4.  **Job Approval**: When a job needs approval (`ACTION_REQUIRED`).
5.  **Job Published**: When a job goes live (`SUCCESS`).
6.  **Offer Approval**: When an offer requests Admin review (`ACTION_REQUIRED`).
7.  **Offer Approved**: When an offer is approved by an Admin (`SUCCESS`).

## Integration Guide
 To send a notification from another service (e.g., when a candidate applies):
 ```typescript
 await this.notificationsService.create({
   userId: recruiterId,
   type: 'INFO',
   message: 'New candidate applied for Engineering Manager',
   link: '/applications/123'
 });
 ```
