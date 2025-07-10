import React from 'react';
import styles from './Modal.module.css';

// 닫기 아이콘 (X)
const CloseIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);


/**
 * Modal 컴포넌트
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {function} props.onClose - 모달을 닫을 때 호출될 함수
 */
const Modal = ({ onClose }) => {
  return (
    // 모달 배경 (Backdrop)
    // 클릭하면 onClose 함수를 호출하여 모달을 닫습니다.
    <div className={styles.backdrop} onClick={onClose}>
      
      {/* 모달 콘텐츠 */}
      {/* 이벤트 버블링을 막기 위해 콘텐츠 영역 클릭 시에는 모달이 닫히지 않도록 합니다. */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* 닫기 버튼 */}
        <button className={styles.closeButton} onClick={onClose} aria-label="모달 닫기">
          <CloseIcon className={styles.icon} />
        </button>
        
        <h2>설정</h2>
        <p>이곳에 설정 관련 내용을 넣을 수 있습니다.</p>
        <ul>
          <li>알림 설정</li>
          <li>로그아웃</li>
          <li>버전 정보</li>
        </ul>
      </div>

    </div>
  );
};

export default Modal;
