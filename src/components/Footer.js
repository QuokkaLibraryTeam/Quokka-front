import React, { useState } from 'react';
import styles from './Footer.module.css';
import Modal from './Modal'; // Footer가 직접 Modal을 사용합니다.

// 톱니바퀴 아이콘 (SVG)
const CogIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M12 2v2" />
    <path d="M12 22v-2" />
    <path d="m17 20.66-1-1.73" />
    <path d="M11 10.27 7 3.34" />
    <path d="m20.66 17-1.73-1" />
    <path d="m3.34 7 1.73 1" />
    <path d="M14 12h8" />
    <path d="M2 12h2" />
    <path d="m20.66 7-1.73 1" />
    <path d="m3.34 17 1.73-1" />
    <path d="m17 3.34-1 1.73" />
    <path d="m11 13.73-4 6.93" />
  </svg>
);

/**
 * Footer 컴포넌트
 * 이제 모달의 상태와 제어를 내부적으로 처리합니다.
 */
const Footer = () => {
  // 모달의 열림/닫힘 상태를 Footer가 직접 관리합니다.
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    // 두 개 이상의 요소를 반환하기 위해 React.Fragment(<>)를 사용합니다.
    <>
      <footer className={styles.footer}>
        <button 
          className={styles.settingsButton} 
          onClick={handleOpenModal} // 내부 함수를 직접 호출
          aria-label="설정 열기"
        >
          <CogIcon className={styles.icon} />
        </button>
      </footer>

      {/* isModalOpen 상태에 따라 Modal을 직접 렌더링합니다. */}
      {isModalOpen && <Modal onClose={handleCloseModal} />}
    </>
  );
};

export default Footer;
