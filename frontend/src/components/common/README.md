# Protected Route System

This document describes the comprehensive protected route mechanism implemented in the React frontend application.

## Overview

The protected route system provides multiple layers of security and access control:

1. **Route-level protection** - Automatic protection for entire routes
2. **Component-level protection** - Conditional rendering based on permissions
3. **Programmatic protection** - Guard-based navigation and access control
4. **Permission-based UI** - Show/hide UI elements based on user permissions

## Components

### 1. Protected Component (`Protected.tsx`)

The main component for protecting routes and components.

```tsx
import ProtectedRoute from '@/components/common/Protected';

<ProtectedRoute 
  requiredPermission="VIEW:USERS"
  requiredRole="ADMIN"
  fallback={<LoadingSpinner />}
  redirectTo="/login"
>
  <YourComponent />
</ProtectedRoute>
```

**Props:**
- `requiredPermission` - Single permission required
- `requiredRole` - Single role required
- `fallback` - Component to show while loading or if access denied
- `redirectTo` - Where to redirect if not authenticated

### 2. PermissionGate Component (`PermissionGate.tsx`)

For conditional rendering based on permissions and roles.

```tsx
import PermissionGate from '@/components/common/PermissionGate';

<PermissionGate 
  permission="VIEW:USERS"
  fallback={<p>Access denied</p>}
>
  <UserManagementPanel />
</PermissionGate>

<PermissionGate 
  permissions={["VIEW:USERS", "VIEW:ROLES"]}
  roles={["ADMIN", "MANAGER"]}
  requireAll={false}
>
  <AdminPanel />
</PermissionGate>
```

**Props:**
- `permission` - Single permission required
- `permissions` - Array of permissions (ANY or ALL based on `requireAll`)
- `role` - Single role required
- `roles` - Array of roles (ANY or ALL based on `requireAll`)
- `fallback` - Component to show if access denied
- `requireAll` - If true, requires ALL permissions/roles, otherwise ANY

### 3. Higher-Order Component (`withRouteProtection.tsx`)

For wrapping components with protection logic.

```tsx
import { withRouteProtection } from '@/components/common/withRouteProtection';

const ProtectedComponent = withRouteProtection(YourComponent, {
  requiredPermission: "VIEW:USERS"
});

export default ProtectedComponent;
```

## Hooks

### usePermissions Hook (`usePermissions.ts`)

Provides easy access to permission checking functions.

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { 
    can, 
    canAny, 
    hasRole, 
    hasAnyRole,
    isAdmin,
    canManageUsers 
  } = usePermissions();

  if (can("VIEW:USERS")) {
    // Show user management
  }

  if (isAdmin) {
    // Show admin features
  }

  return <div>...</div>;
};
```

**Available methods:**
- `can(permission)` - Check single permission
- `canAny(permissions)` - Check if user has any of the permissions
- `hasRole(role)` - Check single role
- `hasAnyRole(roles)` - Check if user has any of the roles
- `userPermissions` - Array of user's permissions
- `userRoles` - Array of user's roles
- `isAuthenticated` - Boolean for authentication status
- `isAdmin` - Boolean for admin status
- `isSuperAdmin` - Boolean for super admin status
- Predefined permission checks (e.g., `canManageUsers`, `canViewDashboard`)

## Utilities

### Route Guards (`routeGuards.ts`)

For programmatic navigation with access control.

```tsx
import { useRouteGuard, navigateWithGuard } from '@/utils/routeGuards';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    const guard = useRouteGuard("VIEW:USERS");
    navigateWithGuard(navigate, "/users", guard);
  };

  return <button onClick={handleNavigate}>Go to Users</button>;
};
```

### Permissions (`permissions.ts`)

Centralized permission and role definitions.

```tsx
import { PERMISSIONS, ROLES } from '@/utils/permissions';

// Available permissions
PERMISSIONS.VIEW_DASHBOARD
PERMISSIONS.VIEW_USERS
PERMISSIONS.CREATE_USERS
PERMISSIONS.EDIT_USERS
PERMISSIONS.DELETE_USERS
// ... and more

// Available roles
ROLES.SUPER_ADMIN
ROLES.ADMIN
ROLES.MANAGER
ROLES.USER
```

## Route Configuration

Routes can be configured with protection in the routes configuration:

```tsx
const routes: AppRoute[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    protection: {
      requiredPermission: PERMISSIONS.VIEW_DASHBOARD
    },
    meta: {
      title: "Dashboard",
      icon: "dashboard"
    }
  },
  {
    path: "/admin",
    element: <AdminPanel />,
    protection: {
      requiredRole: ROLES.ADMIN
    }
  }
];
```

## Best Practices

### 1. Use Permission Constants
Always use the predefined permission constants instead of hardcoded strings:

```tsx
// ✅ Good
<PermissionGate permission={PERMISSIONS.VIEW_USERS}>

// ❌ Bad
<PermissionGate permission="VIEW:USERS">
```

### 2. Provide Meaningful Fallbacks
Always provide fallback content for better UX:

```tsx
<PermissionGate 
  permission={PERMISSIONS.VIEW_USERS}
  fallback={<p>You don't have permission to view this content</p>}
>
  <UserManagementPanel />
</PermissionGate>
```

### 3. Use Appropriate Protection Levels
- Use `ProtectedRoute` for entire pages/routes
- Use `PermissionGate` for specific UI components
- Use `usePermissions` hook for conditional logic

### 4. Handle Loading States
Always handle loading states in protected components:

```tsx
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated && Object.keys(user).length === 0) {
  return <LoadingSpinner />;
}
```

### 5. Graceful Degradation
Design your UI to work even when certain permissions are missing:

```tsx
<PermissionGate permission={PERMISSIONS.EDIT_USERS}>
  <EditButton />
</PermissionGate>
<PermissionGate permission={PERMISSIONS.VIEW_USERS}>
  <ViewButton />
</PermissionGate>
```

## Error Handling

The system provides comprehensive error handling:

1. **Authentication errors** - Redirect to login
2. **Permission errors** - Show access denied page
3. **Loading states** - Show loading spinner
4. **Fallback content** - Show alternative content when access denied

## Security Considerations

1. **Client-side only** - This is client-side protection and should be complemented with server-side validation
2. **Token validation** - Always validate tokens on the server
3. **Permission caching** - Permissions are cached in the auth context
4. **Route protection** - All sensitive routes should have protection configured

## Examples

See `ProtectedRouteExample.tsx` for comprehensive examples of how to use the protected route system in different scenarios. 