import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css'; 

// --- 아이콘 컴포넌트 (SVG) ---

const MenuIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BackIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
  
  const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
  
  
  /**
   * Header 컴포넌트
   * @param {object} props
   * @param {string} props.type - 'main' 또는 'chat'
   */
  const Header = ({ type = 'main' }) => {
    const navigate = useNavigate();
  
    // 채팅 헤더 UI
    if (type === 'chat'  || type === 'multiplayer') {
      return (
        <header className={`${styles.header} ${styles.chatHeader}`}>
          <button onClick={() => navigate(-1)} className={styles.menuButton} aria-label="뒤로 가기">
            <BackIcon className={styles.icon} />
          </button>
          <button onClick={() => navigate('/')} className={styles.profileButton} aria-label="닫기">
            <CloseIcon className={styles.icon} />
          </button>
        </header>
      );
    }
  
    // 기본 헤더 UI
    return (
      <header className={styles.header}>
        <button className={styles.menuButton} aria-label="메뉴 열기">
          <MenuIcon className={styles.icon} />
        </button>
        <button className={styles.profileButton} aria-label="프로필 보기">
          <UserIcon className={styles.icon} />
        </button>
      </header>
    );
  };
  
  export default Header;