import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProtectedRoute from '../components/ProtectedRoute';

function WishlistContent() {
  const { wishlist } = useCart();

  if (!wishlist.length) {
    return (
      <div className="empty-state">
        <h3>Your wishlist is empty</h3>
        <p>Save items you love for later</p>
        <Link to="/shop" className="btn btn-primary">Browse Collection</Link>
      </div>
    );
  }

  return (
    <div className="grid-products" style={{ padding: '2rem 0' }}>
      {wishlist.map((item, i) => (
        <ProductCard key={item.id} product={item.product} index={i} />
      ))}
    </div>
  );
}

export default function Wishlist() {
  return (
    <div>
      <div className="page-header"><h1>My Wishlist</h1></div>
      <div className="container">
        <ProtectedRoute><WishlistContent /></ProtectedRoute>
      </div>
    </div>
  );
}
