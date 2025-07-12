import React, { useState } from 'react';
import styles from './View.module.css'; // View 전용 CSS 모듈

const View = ({ draft, onReview }) => {
    const [currentPage, setCurrentPage] = useState(0); // 0: 내용 페이지, 1: 선택 페이지
    const BACKEND_URL = 'http://localhost:8000';

    // 이미지 파일명 추출 및 전체 URL 생성
    const filename = draft.image.split('/').pop();
    const imageUrl = `${BACKEND_URL}/illustrations/${filename}`;

    const synopsisText = draft.synopsis.split('QUESTION:')[0].trim();

    return (
        <div className={styles.viewContainer}>
            <div className={styles.content}>
                {/* --- 페이지 1: 동화 내용 --- */}
                {currentPage === 0 && (
                    <div className={styles.page}>
                        <div className={styles.title}>[ 동화 초안 ]</div>
                        <img src={imageUrl} alt="동화 삽화" className={styles.draftImage} />
                        <p className={styles.synopsis}>{synopsisText}</p>
                    </div>
                )}

                {/* --- 페이지 2: 선택지 --- */}
                {currentPage === 1 && (
                    <div className={styles.page}>
                        <div className={styles.title}>[ 끝! ]</div>
                        <div className={styles.buttonGroup}>
                            <button onClick={() => onReview('retry')} className={styles.actionButton}>
                                마음에 안들어요
                            </button>
                            <button onClick={() => onReview('accept')} className={styles.actionButton}>
                                동화 이어서 만들래요
                            </button>
                            <button onClick={() => onReview('accept')} className={styles.actionButton}>
                                나가기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- 하단 네비게이션 --- */}
            <div className={styles.footer}>
                {currentPage === 0 && (
                    <button onClick={() => setCurrentPage(1)} className={styles.navButton}>
                        다음 &gt;
                    </button>
                )}
                <div className={styles.pageIndicator}>
                    {currentPage + 1} / 2
                </div>
            </div>
        </div>
    );
};

export default View;