import React, { useState, useEffect } from 'react';
import styles from './LazyImage.module.css';

/**
 * 이미지를 지연 로딩하고 로딩 중에는 스켈레톤 UI를 보여주는 컴포넌트
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {string} props.src - 이미지 소스 URL
 * @param {string} props.alt - 이미지 대체 텍스트
 */
const LazyImage = ({ src, alt }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const image = new Image();
    image.src = src;
    
    // 이미지가 성공적으로 로드되면 로딩 상태를 변경합니다.
    image.onload = () => {
      setIsLoading(false);
    };

    // 에러 처리: 이미지 로드에 실패해도 로딩 상태를 종료합니다.
    image.onerror = () => {
        setIsLoading(false);
        console.error(`Failed to load image at: ${src}`);
    }
  }, [src]);

  return (
    <div className={styles.imageContainer}>
      {isLoading ? (
        // 로딩 중일 때 보여줄 스켈레톤 UI
        <div className={styles.skeleton}></div>
      ) : (
        // 로딩 완료 후 실제 이미지
        <img src={src} alt={alt} className={styles.image} />
      )}
    </div>
  );
};

// 이 부분이 가장 중요합니다. 컴포넌트를 default로 export 해야 합니다.
export default LazyImage;
