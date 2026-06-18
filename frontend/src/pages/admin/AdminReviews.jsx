import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { productAPI } from '../../services/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await productAPI.reviews();
    setReviews(data.results || data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const setApproval = async (review, approved) => {
    try {
      if (approved) await productAPI.approveReview(review.id);
      else await productAPI.rejectReview(review.id);
      await load();
      toast.success(approved ? 'Review approved and published' : 'Review hidden');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update review');
    }
  };

  const remove = async (review) => {
    if (!window.confirm(`Delete review from ${review.user_name}?`)) return;
    try {
      await productAPI.deleteReview(review.id);
      await load();
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete review');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Review Management</h1>
          <p className="admin-page-subtitle">Approve, hide, or permanently delete customer reviews.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.user_name}</td>
                <td><span className="admin-stars">{'★'.repeat(review.rating)}</span></td>
                <td><strong>{review.title}</strong><br /><span className="admin-muted">{review.comment}</span></td>
                <td>
                  {review.is_approved
                    ? <span className="badge badge-gold">Published</span>
                    : <span className="badge badge-sale">Pending</span>}
                </td>
                <td>
                  <div className="admin-actions">
                    {review.is_approved ? (
                      <button className="btn btn-sm btn-outline" onClick={() => setApproval(review, false)}>Hide</button>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => setApproval(review, true)}>Approve</button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(review)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!reviews.length && <tr><td colSpan="5">No reviews found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
