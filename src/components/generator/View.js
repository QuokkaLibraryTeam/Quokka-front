import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './View.module.css';

const View = ({ draft, onReview }) => {
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:8000';

    // 1. synopsis 텍스트를 문단 배열로 변환
    const paragraphs = useMemo(() => {
        if (!draft?.synopsis) return [];
        // 'QUESTION:' 이전의 텍스트만 사용하고, 줄바꿈으로 문단 분리
        return draft.synopsis.split('QUESTION:')[0].trim().split('\n').filter(p => p.trim() !== '');
    }, [draft.synopsis]);

    // 2. 전체 페이지 수 계산 (문단 페이지 + 마지막 선택 페이지)
    const totalPages = paragraphs.length + 1;
    const [currentPage, setCurrentPage] = useState(0);

    // 이미지 URL 생성
    const imageUrl = useMemo(() => {
        if (!draft?.image) return '';
        const filename = draft.image.split('/').pop();
        return `${BACKEND_URL}/illustrations/${filename}`;
    }, [draft.image]);

    // --- 페이지 이동 핸들러 ---
    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    // 현재 페이지가 동화 내용 페이지인지 확인
    const isContentPage = currentPage < paragraphs.length;

    return (
        <div className={styles.viewContainer}>
            <div className={styles.bookContainer}>
                <div className={styles.pageContent}>
                    {isContentPage ? (
                        /* --- 동화 내용 페이지 --- */
                        <>
                            <div className={styles.imageWrapper}>
                                <img src={imageUrl} alt="동화 삽화" className={styles.draftImage} />
                            </div>
                            <p className={styles.storyParagraph}>
                                {paragraphs[currentPage]}
                            </p>
                        </>
                    ) : (
                        /* --- 마지막 선택 페이지 --- */
                        <div className={styles.finalChoicePage}>
                            <h3 className={styles.finalTitle}>동화 초안 완성!</h3>
                            <p className={styles.finalSubtitle}>다음으로 무엇을 할까요?</p>
                            <div className={styles.buttonGroup}>
                                <button onClick={() => onReview('retry')} className={`${styles.actionButton} ${styles.retry}`}>
                                    다시 쓸래요
                                </button>
                                <button onClick={() => onReview('accept')} className={`${styles.actionButton} ${styles.continue}`}>
                                    이어서 만들래요
                                </button>
                                <button onClick={() => onReview('accept')}  className={`${styles.actionButton} ${styles.exit}`}>
                                    책 덮기
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- 하단 네비게이션 --- */}
                <div className={styles.footer}>
                    <button onClick={handlePrev} disabled={currentPage === 0} className={styles.navButton}>
                        이전
                    </button>
                    <div className={styles.pageIndicator}>
                        {currentPage + 1} / {totalPages}
                    </div>
                    <button onClick={handleNext} disabled={currentPage === totalPages - 1} className={styles.navButton}>
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default View;
