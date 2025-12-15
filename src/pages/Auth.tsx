import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/profile'); // Redirect to profile on success
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div className="container py-5 d-flex flex-column justify-content-center" style={{minHeight: '80vh'}}>
      <div className="glass-panel p-4 rounded-4 shadow-lg mx-auto w-100" style={{maxWidth: '400px'}}>
        <h2 className="text-center fw-bold text-glow mb-4">
            {isLogin ? 'Access Vault' : 'Initialize ID'}
        </h2>
        
        {error && <div className="alert alert-danger small py-2">{error}</div>}

        <form onSubmit={handleAuth}>
            <div className="mb-3">
                <label className="small text-muted mb-1">EMAIL FREQUENCY</label>
                <input 
                    type="email" 
                    className="form-control bg-dark text-white border-secondary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                />
            </div>
            <div className="mb-4">
                <label className="small text-muted mb-1">SECURITY KEY</label>
                <input 
                    type="password" 
                    className="form-control bg-dark text-white border-secondary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                />
            </div>
            
            <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold">
                {isLogin ? 'DECRYPT & ENTER' : 'CREATE IDENTITY'}
            </button>
        </form>

        <div className="text-center mt-4">
            <small className="text-muted">
                {isLogin ? "New user? " : "Already have an ID? "}
                <button 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="btn btn-link p-0 text-primary text-decoration-none fw-bold"
                >
                    {isLogin ? 'Create Account' : 'Login'}
                </button>
            </small>
        </div>
      </div>
    </div>
  );
};