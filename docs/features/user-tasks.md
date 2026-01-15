# User Tasks System

The User Tasks system allows recruiters and hiring managers to track to-do items related to candidates and jobs. This is distinct from background system jobs.

## Architecture

### Backend
- **Module**: `TasksModule` (Renamed/Refactored context)
- **Data Model**: `UserTask` (Prisma)
  - Fields: `title`, `description`, `assignedToId`, `status`, `priority`, `dueDate`.
- **Service**: `UserTasksService`
  - CRUD operations for managing tasks.
- **Controller**: `TasksController`
  - Endpoints to create, update, and list tasks for the authenticated user.

### Frontend
- **Page**: `/tasks`
  - A dashboard view listing tasks by status/priority.
  - Allows marking tasks as done.
- **Navigation**: Accessible via "My Tasks" in the Sidebar (Collaboration section).

## Future Enhancements
- Link tasks directly to candidates (e.g., "Review Resume" task links to Candidate Profile).
- Due date reminders via the Notifications System.
