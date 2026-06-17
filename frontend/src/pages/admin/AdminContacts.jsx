import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    adminAPI.contacts().then((r) => setContacts(r.data.results || r.data));
  }, []);

  const updateStatus = async (id, status) => {
    await adminAPI.updateContact(id, { status });
    toast.success('Updated');
    const { data } = await adminAPI.contacts();
    setContacts(data.results || data);
  };

  return (
    <div>
      <h1 className="admin-page-title">Contact Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.subject}</td>
                <td>{c.status}</td>
                <td>
                  <select className="form-input" style={{ width: 'auto', padding: '0.25rem' }} value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}>
                    {['new', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
