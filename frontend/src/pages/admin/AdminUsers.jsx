import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const { data } = await adminAPI.users();
    setUsers(data.results || data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setDraft({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveUser = async (id) => {
    if (!draft.username.trim()) {
      toast.error('Username is required');
      return;
    }

    setSaving(true);
    try {
      await adminAPI.updateUser(id, {
        username: draft.username.trim(),
        first_name: draft.first_name.trim(),
        last_name: draft.last_name.trim(),
        role: draft.role,
      });
      toast.success('User updated');
      cancelEdit();
      await loadUsers();
    } catch (err) {
      const detail = err.response?.data?.username?.[0] || err.response?.data?.detail || 'Could not update user';
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (id, isBlocked) => {
    await adminAPI.updateUser(id, { is_blocked: !isBlocked });
    toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    await loadUsers();
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Control customer usernames, roles, and account access.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {isEditing ? (
                      <input
                        className="admin-input"
                        value={draft.username}
                        onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                      />
                    ) : (
                      <strong>{user.username}</strong>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="admin-inline-fields">
                        <input
                          className="admin-input"
                          placeholder="First name"
                          value={draft.first_name}
                          onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                        />
                        <input
                          className="admin-input"
                          placeholder="Last name"
                          value={draft.last_name}
                          onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
                        />
                      </div>
                    ) : (
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        className="admin-input"
                        value={draft.role}
                        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="status-badge status-confirmed">{user.role}</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_blocked ? 'status-cancelled' : 'status-delivered'}`}>
                      {user.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      {isEditing ? (
                        <>
                          <button className="btn btn-sm btn-primary" disabled={saving} onClick={() => saveUser(user.id)}>
                            Save
                          </button>
                          <button className="btn btn-sm btn-outline" disabled={saving} onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm btn-outline" onClick={() => startEdit(user)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => toggleBlock(user.id, user.is_blocked)}>
                            {user.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
