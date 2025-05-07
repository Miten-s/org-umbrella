import { useState } from 'react';

const mockAdmins = [
  { id: '1', name: 'Alice', email: 'alice@example.com', roles: ['Admin'] },
  { id: '2', name: 'Bob', email: 'bob@example.com', roles: ['Editor'] }
];

const allRoles = ['Admin', 'Editor', 'Manager'];

const AllAdmins = () => {
  const [admins, setAdmins] = useState(mockAdmins);

  const handleRoleChange = (adminId: string, newRole: string) => {
    setAdmins(admins.map(admin =>
      admin.id === adminId && !admin.roles.includes(newRole)
        ? { ...admin, roles: [...admin.roles, newRole] }
        : admin
    ));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">All Admins</h2>
      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Roles</th>
            <th className="px-6 py-3 text-left">Add Role</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id}>
              <td className="px-6 py-4">{admin.name}</td>
              <td className="px-6 py-4">{admin.email}</td>
              <td className="px-6 py-4">
                {admin.roles.map(role => (
                  <span key={role} className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs mr-1">
                    {role}
                  </span>
                ))}
              </td>
              <td className="px-6 py-4">
                <select
                  className="border rounded px-2 py-1"
                  onChange={e => handleRoleChange(admin.id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Add role</option>
                  {allRoles
                    .filter(role => !admin.roles.includes(role))
                    .map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllAdmins;