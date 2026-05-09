# Enhanced Button Component

The Button component now includes built-in permission checking functionality with tooltip support.

## Features

- **Permission Checking**: Automatically checks user permissions before allowing actions
- **Tooltip Display**: Shows helpful tooltips when users don't have permission
- **Disabled State**: Automatically disables the button when permission is not available
- **Backward Compatible**: All existing Button usage continues to work without changes

## Usage

### Basic Button (No Permission Check)

```tsx
import Button from "@/components/ui/button/Button";

<Button onClick={() => handleClick()}>Click Me</Button>;
```

### Button with Permission Check

```tsx
<Button permission="CREATE:USER" onClick={() => handleCreateUser()}>
  Create User
</Button>
```

### Button with Custom Tooltip Message

```tsx
<Button
  permission="CREATE:DEPARTMENT"
  onClick={() => handleCreateDepartment()}
  tooltipMessage="You need admin privileges to create departments"
>
  Create Department
</Button>
```

### Button with Different Tooltip Position

```tsx
<Button
  permission="CREATE:ROLE"
  onClick={() => handleCreateRole()}
  tooltipPosition="bottom"
>
  Create Role
</Button>
```

## Props

| Prop              | Type                                                     | Default      | Description                             |
| ----------------- | -------------------------------------------------------- | ------------ | --------------------------------------- |
| `children`        | `ReactNode`                                              | **Required** | Button content                          |
| `size`            | `"sm" \| "md"`                                           | `"md"`       | Button size                             |
| `variant`         | `"primary" \| "outline" \| "secondary" \| "destructive"` | `"primary"`  | Button style variant                    |
| `startIcon`       | `ReactNode`                                              | -            | Icon before button text                 |
| `endIcon`         | `ReactNode`                                              | -            | Icon after button text                  |
| `onClick`         | `() => void`                                             | -            | Function to call when button is clicked |
| `onMouseEnter`    | `() => void`                                             | -            | Mouse enter handler                     |
| `onMouseLeave`    | `() => void`                                             | -            | Mouse leave handler                     |
| `disabled`        | `boolean`                                                | `false`      | Whether the button is disabled          |
| `className`       | `string`                                                 | `""`         | Additional CSS classes                  |
| `type`            | `"button" \| "submit" \| "reset"`                        | `"button"`   | Button type                             |
| `permission`      | `string`                                                 | -            | Permission required to use this button  |
| `tooltipMessage`  | `string`                                                 | -            | Custom tooltip message                  |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'`                 | `'top'`      | Position of the tooltip                 |

## Available Permissions

Based on the backend migration, the following permissions are available:

- `CREATE:USER` - Create new users
- `CREATE:DEPARTMENT` - Create new departments
- `CREATE:DESIGNATION` - Create new designations
- `CREATE:LOCATION` - Create new locations
- `CREATE:ROLE` - Create new roles
- `CREATE:PERMISSION` - Create new permissions
- `VIEW:USER` - View users
- `VIEW:DEPARTMENT` - View departments
- `VIEW:DESIGNATION` - View designations
- `VIEW:LOCATION` - View locations
- `VIEW:ROLE` - View roles
- `VIEW:PERMISSION` - View permissions
- `VIEW:DASHBOARD` - View dashboard
- `UPDATE:USER` - Update users
- `UPDATE:DEPARTMENT` - Update departments
- `UPDATE:DESIGNATION` - Update designations
- `UPDATE:LOCATION` - Update locations
- `UPDATE:ROLE` - Update roles
- `UPDATE:PERMISSION` - Update permissions
- `DELETE:USER` - Delete users
- `DELETE:DEPARTMENT` - Delete departments
- `DELETE:DESIGNATION` - Delete designations
- `DELETE:LOCATION` - Delete locations
- `DELETE:ROLE` - Delete roles
- `DELETE:PERMISSION` - Delete permissions
- `OPERATE:ALL` - Super admin permission (grants all permissions)

## Translation Keys

The component uses the following translation key for tooltip messages:

- `noPermissionMessage`: "You don't have permission to {{action}} {{entity}}"

The `{{action}}` and `{{entity}}` placeholders are automatically filled based on the permission string.

## Implementation Notes

- The component uses the existing `hasPermission` utility function
- Tooltips are automatically hidden when clicking outside the button
- The button is automatically disabled and styled with reduced opacity when permission is not available
- All existing Button functionality is preserved
- Permission checking is optional - buttons without the `permission` prop work exactly as before
