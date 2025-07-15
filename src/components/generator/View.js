import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './View.module.css';

const View = ({ draft, onReview }) => {
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:8000';

    // --- ⭐️ TTS 관련 상태 추가 ---
    const [ttsConfig, setTtsConfig] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // 컴포넌트 마운트 시 TTS 설정 불러오기
    useEffect(() => {
        const savedConfig = localStorage.getItem('ttsConfig');
        if (savedConfig) {
            setTtsConfig(JSON.parse(savedConfig));
        } else {
            // 기본 설정
            setTtsConfig({ voice: 'female', rate: 1, pitch: 1 });
        }

        // 컴포넌트 언마운트 시 TTS 정지
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const paragraphs = useMemo(() => {
        if (!draft?.synopsis) return [];
        return draft.synopsis.split('QUESTION:')[0].trim().split('\n').filter(p => p.trim() !== '');
    }, [draft.synopsis]);

    const totalPages = paragraphs.length + 1;
    const [currentPage, setCurrentPage] = useState(0);

    const imageUrl = useMemo(() => {
        if (!draft?.image) return '';
        const filename = draft.image.split('/').pop();
        return `${BACKEND_URL}/illustrations/${filename}`;
    }, [draft.image]);

    const handleNext = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrev = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const handleExit = () => {
        onReview('accept')
        navigate('/'); // 메인 페이지로 이동
    };

    // --- ⭐️ TTS 재생 핸들러 추가 ---
    const handleParagraphClick = (text) => {
        if (!ttsConfig || !text) return;

        // 이미 재생 중이면 정지, 아니면 재생
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // 목소리 설정 (브라우저 지원에 따라 다름)
        const voices = window.speechSynthesis.getVoices();
        if (ttsConfig.voice === 'female') {
            utterance.voice = voices.find(v => v.name.includes('Korean') && v.name.includes('Female')) || voices.find(v => v.lang === 'ko-KR');
        } else {
            utterance.voice = voices.find(v => v.name.includes('Korean') && v.name.includes('Male')) || voices.find(v => v.lang === 'ko-KR');
        }
        
        utterance.pitch = ttsConfig.pitch;
        utterance.rate = ttsConfig.rate;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const isContentPage = currentPage < paragraphs.length;

    return (
        <div className={styles.viewContainer}>
            <div className={styles.bookContainer}>
                <div className={styles.pageContent}>
                    {isContentPage ? (
                        <>
                            <div className={styles.imageWrapper}>
                                <img src={imageUrl} alt="동화 삽화" className={styles.draftImage} />
                            </div>
                            {/* ⭐️ p 태그에 onClick과 className 추가 */}
                            <p 
                                className={`${styles.storyParagraph} ${isSpeaking ? styles.speaking : ''}`}
                                onClick={() => handleParagraphClick(paragraphs[currentPage])}
                            >
                                {paragraphs[currentPage]}
                            </p>
                        </>
                    ) : (
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
                                {/* ⭐️ '책 덮기' 버튼 기능 수정 */}
                                <button onClick={handleExit}  className={`${styles.actionButton} ${styles.exit}`}>
                                    책 덮기
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
