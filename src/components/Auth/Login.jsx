import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

function Login({ onShowSignUp }) {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Spotify Logo */}
          <div className="logo">
            <FaSpotify size={40} color="#1ED760" aria-label="Spotify" />
          </div>

          <h1>Welcome back</h1>

          <label>Email</label>
          <input type="email" placeholder="" />

          <button className="auth-btn">Continue</button>

          <div className="divider">
            <span>or</span>
          </div>

          <SocialButtons authType="login" />

          <p className="auth-footer-text">
            Don't have an account?
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onShowSignUp?.();
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
