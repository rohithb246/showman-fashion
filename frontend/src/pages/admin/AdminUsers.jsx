import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminAPI.users().then((r) => setUsers(r.data.results || r.data));
  }, []);

  const toggleBlock = async (id, is_blocked) => {
    await adminAPI.updateUser(id, { is_blocked: !is_blocked });
    toast.success('User updated');
    const { data } = await adminAPI.users();
    setUsers(data.results || data);
  };

  return (
    <div>
      <h1 className="admin-page-title">User Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.role}</td>
                <td>{u.is_blocked ? 'Blocked' : 'Active'}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleBlock(u.id, u.is_blocked)}>
                    {u.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
