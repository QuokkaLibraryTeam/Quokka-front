import React, { useState } from 'react';
import styles from './DrawerCard.module.css';
import LazyImage from './LazyImage';

// 물음표 아이콘
const QuestionIcon = () => (
    <div className={styles.questionIcon}>?</div>
);

/**
 * 클릭하면 옆으로 슬라이드되며 컨텐츠(버튼)를 보여주는 카드 컴포넌트
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {string} props.imageSrc - 카드에 표시될 이미지 소스
 * @param {string} props.imageAlt - 이미지 대체 텍스트
 * @param {React.ReactNode} props.children - 슬라이드 후 보여줄 버튼들
 */
const DrawerCard = ({ imageSrc, imageAlt, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.drawerCard}>
      <div className={`${styles.drawerContent} ${isOpen ? styles.open : ''}`}>
        
        {/* 이미지 영역 (클릭 가능) */}
        <div className={styles.imageSide}>
          <button onClick={toggleDrawer} className={styles.imageButton}>
            <div className={styles.imageWrapper}>
              <LazyImage src={imageSrc} alt={imageAlt} />
              <QuestionIcon />
            </div>
          </button>
        </div>

        {/* 버튼 영역 (숨겨져 있음) */}
        <div className={styles.buttonSide}>
          {children}
        </div>

      </div>
    </div>
  );
};

export default DrawerCard;
