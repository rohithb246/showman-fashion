import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);

  const load = () => productAPI.reviews().then((r) => setReviews(r.data.results || r.data));
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await productAPI.approveReview(id);
    toast.success('Review approved');
    load();
  };

  const remove = async (id) => {
    await productAPI.deleteReview(id);
    toast.success('Review deleted');
    load();
  };

  return (
    <div>
      <h1 className="admin-page-title">Review Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Rating</th><th>Comment</th><th>Approved</th><th>Actions</th></tr></thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{r.user_name}</td>
                <td>{'★'.repeat(r.rating)}</td>
                <td>{r.comment?.slice(0, 50)}...</td>
                <td>{r.is_approved ? 'Yes' : 'No'}</td>
                <td>
                  {!r.is_approved && <button className="btn btn-sm btn-primary" onClick={() => approve(r.id)}>Approve</button>}
                  <button className="btn btn-sm btn-outline" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
