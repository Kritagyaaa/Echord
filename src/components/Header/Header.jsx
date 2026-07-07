import { SearchDropdown } from "../SearchDropdown/SearchDropdown";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  ExternalLink,
  User,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { searchSongs } from "../../services/api";
export function Header({
  onHomeClick,
  user,
  onLogout,
  onAccountClick,
  onProfileClick,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) {

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const searchContainerRef = useRef(null);
  const profileWrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (profileWrapperRef.current && !profileWrapperRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearch(false);
        return;
      }

      try {
        const results = await searchSongs(searchQuery, {
          signal: controller.signal,
        });
        setSearchResults(results);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setSearchResults([]);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, setSearchResults]);
  return (
    <header className={styles.navbar} aria-label="Main navigation">
      <div className={styles.left}>
        <div className={styles.siteHeader} onClick={onHomeClick} title="Go to Home" role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onHomeClick(); }}>
          <img src="/logo.svg" alt="Echord Logo" className={styles.titleLogo} />
          <span className={styles.siteTitle}>E C H O R D</span>
        </div>
      </div>

      <div className={styles.center}>
        <button
          className={styles.homeButton}
          type="button"
          aria-label="Home"
          onClick={onHomeClick}
        >
          <Home size={26} fill="currentColor" strokeWidth={2.1} />
        </button>

        <div className={styles.searchContainer} ref={searchContainerRef}>
          <div className={styles.searchBox}>
            <Search size={22} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="What do you want to play?"
              aria-label="Search music"
              value={searchQuery}
              onChange={(e) => {

                setSearchQuery(e.target.value);

                if (e.target.value.trim()) {
                  setShowSearch(true);
                }

              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSearch(true);
                }
              }}
              onClick={() => {
                if (searchQuery.trim()) {
                  setShowSearch(true);
                }
              }}
            />
            <button
              type="button"
              className={styles.briefcaseButton}
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                navigate("/browse");
              }}
              title="Browse Genres & Creators"
              aria-label="Browse"
            >
              <Briefcase size={22} strokeWidth={2.1} />
            </button>
          </div>

          <SearchDropdown
            results={searchResults}
            visible={showSearch}
            onClose={() => setShowSearch(false)}
          />
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.profileWrapper} ref={profileWrapperRef}>
          <div
            className={`${styles.profile} ${!(user?.profile_picture && !user.profile_picture.includes('googleusercontent.com')) ? styles.profileDefault : ''}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            tabIndex={0}
            aria-expanded={showProfileMenu}
            aria-label="User profile menu"
          >
            {user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? (
              <img src={user.profile_picture} alt="Profile" className={styles.profileImg} />
            ) : (
              <span className={styles.profileLetter}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          {showProfileMenu && (
            <div className={styles.profileMenu} role="menu">
              <div
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setShowProfileMenu(false);
                  onAccountClick?.();
                }}
                style={{ cursor: 'pointer' }}
              >
                <span>Account</span>
                <ExternalLink size={16} />
              </div>
              <div
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setShowProfileMenu(false);
                  onProfileClick?.();
                }}
                style={{ cursor: 'pointer' }}
              >
                <span>Profile</span>
              </div>
              {user?.role === 'creator' && (
                <div
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/creator/dashboard");
                  }}
                  style={{ cursor: 'pointer', color: '#870339', fontWeight: 'bold' }}
                >
                  <span>Creator Dashboard</span>
                </div>
              )}
              <div
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/history");
                }}
                style={{ cursor: 'pointer' }}
              >
                Recents
              </div>
              <div className={styles.menuItem} role="menuitem">
                <span>Download</span>
                <ExternalLink size={16} />
              </div>
              <div className={styles.menuItem} role="menuitem">Settings</div>
              <div className={styles.menuItem} role="menuitem" onClick={onLogout} style={{ cursor: 'pointer' }}>Log out</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
