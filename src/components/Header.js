import React from 'react';
// CSS 모듈을 import 합니다. 클래스 이름 충돌을 방지해줍니다.
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


/**
 * Header 컴포넌트
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {function} props.onMenuClick - 메뉴 버튼 클릭 시 호출될 함수
 */
const Header = ({ onMenuClick }) => {
  return (
    <header className={styles.header}>
      
      {/* 왼쪽: 햄버거 메뉴 버튼 */}
      <button 
        onClick={onMenuClick} 
        className={styles.menuButton}
        aria-label="메뉴 열기"
      >
        <MenuIcon className={styles.icon} />
      </button>

      {/* 오른쪽: 프로필 아이콘 버튼 */}
      <button 
        className={styles.profileButton}
        aria-label="프로필 보기"
      >
        <UserIcon className={styles.icon} />
      </button>

    </header>
  );
};

export default Header;