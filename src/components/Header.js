import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

// 뒤로가기 아이콘 SVG 컴포넌트
const BackIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
);

/**
 * Header 컴포넌트
 * @param {object} props
 * @param {string} props.type - 'chat' 또는 'multiplayer'일 때 뒤로가기 버튼을 표시
 */
const Header = ({ type = 'main' }) => {
  const navigate = useNavigate();

  // 채팅 또는 멀티플레이어 페이지에서만 뒤로가기 버튼을 표시
  if (type === 'chat' || type === 'multiplayer') {
    return (
      // 레이아웃에 영향을 주지 않는 새로운 헤더 컨테이너 사용
      <header className={styles.backButtonHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton} aria-label="뒤로 가기">
          <BackIcon className={styles.icon} />
        </button>
      </header>
    );
  }

  // 그 외의 경우에는 헤더를 렌더링하지 않음
  return null;
};

export default Header;
