import { Link } from 'react-router-dom';
import { PersonCircle, BoxArrowInRight } from 'react-bootstrap-icons';
import { auth } from '../../services/firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export const Navbar = () => {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    // Real-time listener for login state changes
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  return (
    <nav className="navbar navbar-dark glass-panel sticky-top" style={{zIndex: 1030}}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* LOGO */}
        <Link to="/" className="navbar-brand mb-0 h1 fw-bold text-glow text-decoration-none">
          ❤️ Pulse<span className="text-primary">Orb</span>
        </Link>
        
        {/* AUTH ACTION */}
        {user ? (
            <Link to="/profile" className="btn btn-sm btn-outline-light rounded-pill d-flex align-items-center gap-2">
                <PersonCircle />
                <span className="d-none d-sm-inline">Profile</span>
            </Link>
        ) : (
            <Link to="/auth" className="btn btn-sm btn-primary rounded-pill d-flex align-items-center gap-2">
                <BoxArrowInRight />
                <span>Login</span>
            </Link>
        )}
      </div>
    </nav>
  );
};