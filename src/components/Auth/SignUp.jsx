import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

function SignUp({ onShowLogin }) {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Spotify Logo */}
          <div className="logo">
            <FaSpotify size={40} color="#1ED760" aria-label="Spotify" />
          </div>

          <h1>Sign up to start listening</h1>

          <label>Email address</label>
          <input type="email" placeholder="name@domain.com" />

          <button className="auth-btn">Next</button>

          <div className="divider">
            <span>or</span>
          </div>

          <SocialButtons authType="signup" />

          <p className="auth-footer-text">
            Already have an account?
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onShowLogin?.();
              }}
            >
              Log in
            </a>
          </p>

          {/* Footer */}
          <div className="auth-extra-footer">
            <p>
              This site is protected by reCAPTCHA and the Google
              <a href="#"> Privacy Policy</a> and
              <a href="#"> Terms of Service</a> apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
