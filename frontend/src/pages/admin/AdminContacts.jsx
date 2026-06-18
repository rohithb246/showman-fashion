import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/api';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});

  const loadContacts = async () => {
    const { data } = await adminAPI.contacts();
    setContacts(data.results || data);
  };

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, []);

  const updateContact = async (contact, changes) => {
    try {
      await adminAPI.updateContact(contact.id, {
        status: changes.status ?? contact.status,
        admin_notes: changes.admin_notes ?? notes[contact.id] ?? contact.admin_notes ?? '',
      });
      await loadContacts();
      toast.success('Contact updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update contact');
    }
  };

  const deleteContact = async (contact) => {
    if (!window.confirm(`Delete message from ${contact.name}?`)) return;
    try {
      await adminAPI.deleteContact(contact.id);
      await loadContacts();
      toast.success('Contact deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete contact');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Contact Management</h1>
          <p className="admin-page-subtitle">Read enquiries, update progress, and keep private admin notes.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {contacts.map((contact) => (
              <Fragment key={contact.id}>
                <tr>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>{contact.subject}</td>
                  <td><span className={`status-badge status-${contact.status}`}>{contact.status.replace('_', ' ')}</span></td>
                  <td>
                    <div className="admin-actions">
                      <select
                        className="admin-input"
                        value={contact.status}
                        onChange={(event) => updateContact(contact, { status: event.target.value })}
                      >
                        {['new', 'in_progress', 'resolved', 'closed'].map((status) => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-outline" onClick={() => setExpanded(expanded === contact.id ? null : contact.id)}>
                        {expanded === contact.id ? 'Close' : 'Read'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteContact(contact)}>Delete</button>
                    </div>
                  </td>
                </tr>
                {expanded === contact.id && (
                  <tr>
                    <td colSpan="5">
                      <div className="admin-contact-details">
                        <div>
                          <strong>Message</strong>
                          <p>{contact.message}</p>
                        </div>
                        <label>
                          <strong>Admin notes</strong>
                          <textarea
                            className="admin-input"
                            rows="4"
                            value={notes[contact.id] ?? contact.admin_notes ?? ''}
                            onChange={(event) => setNotes({ ...notes, [contact.id]: event.target.value })}
                          />
                          <button className="btn btn-sm btn-secondary" onClick={() => updateContact(contact, {})}>Save Notes</button>
                        </label>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!contacts.length && <tr><td colSpan="5">No contact messages found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
