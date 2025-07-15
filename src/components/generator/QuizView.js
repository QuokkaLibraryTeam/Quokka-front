import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../gallery/StoryView.module.css'; // StoryView의 스타일을 그대로 재사용합니다.

const QuizView = () => {
    // storyId를 URL 파라미터에서 가져옵니다.
    const { storyId } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    // --- 상태 관리 (공유/태그 관련 상태 제거) ---
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [ttsConfig, setTtsConfig] = useState({ voice: 'female', rate: 1, pitch: 1 });
    const [isSpeaking, setIsSpeaking] = useState(false);

    // --- 데이터 로딩 (전래동화 상세 정보 가져오기) ---
    useEffect(() => {
        const savedTtsConfig = localStorage.getItem('ttsConfig');
        if (savedTtsConfig) setTtsConfig(JSON.parse(savedTtsConfig));

        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const headers = { 'Authorization': `Bearer ${token}` };

                // ⭐️ 수정된 부분: 전래동화 상세 정보를 가져오는 API 호출
                const storyRes = await fetch(`${BACKEND_URL}/api/v1/users/me/stories/${storyId}`, { headers });
                if (!storyRes.ok) throw new Error('동화 정보를 불러올 수 없습니다.');
                const storyData = await storyRes.json();
                setStory(storyData);

            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => window.speechSynthesis.cancel();
    }, [storyId, navigate, BACKEND_URL]);

    // --- 페이지네이션 데이터 가공 (기존과 동일) ---
    const pages = useMemo(() => {
        if (!story?.scenes) return [];
        
        const allPages = [];
        story.scenes.forEach(scene => {
            const filename = scene.image_url.split('/').pop();
            const imageUrl = `${BACKEND_URL}/illustrations/${filename}`;
            const paragraphs = scene.text.split('\n').filter(p => p.trim() !== '');
            
            paragraphs.forEach(p => {
                allPages.push({ text: p, imageUrl: imageUrl });
            });
        });
        return allPages;
    }, [story, BACKEND_URL]);

    // ⭐️ 수정된 부분: 마지막 페이지가 퀴즈 시작 페이지이므로 전체 페이지 수는 pages.length + 1
    const totalPages = pages.length > 0 ? pages.length + 1 : 1;

    // --- 핸들러 함수 (공유/태그 관련 핸들러 제거) ---
    const handleNavigation = (direction) => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (direction === 'next' && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else if (direction === 'prev' && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const handleExit = () => navigate(-1); // 이전 페이지(퀴즈 목록)로 이동

    const handleParagraphClick = (text) => {
        if (!text) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            utterance.voice = voices.find(v => v.lang === 'ko-KR' && v.name.includes(ttsConfig.voice === 'female' ? 'Female' : 'Male')) || voices.find(v => v.lang === 'ko-KR');
            utterance.pitch = ttsConfig.pitch;
            utterance.rate = ttsConfig.rate;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };
    
    // --- 렌더링 로직 ---
    if (loading) return <div className={styles.loading}>동화책을 펼치는 중...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    const isContentPage = currentPage < pages.length;
    
    // ⭐️ 수정된 부분: 마지막 페이지 렌더링 함수
    const renderLastPage = () => {
        return (
            <div className={styles.finalChoicePage}>
                <h3 className={styles.finalTitle}>이야기 끝!</h3>
                <p className={styles.finalSubtitle}>이제 동화 내용을 바탕으로 퀴즈를 풀어볼까요?</p>
                <div className={styles.buttonGroup}>
                    <button 
                        onClick={() => navigate(`/quiz/${storyId}`)} 
                        className={`${styles.actionButton} ${styles.share}`} // 기존 '공유' 버튼 스타일 재활용
                    >
                        퀴즈 시작하기
                    </button>
                </div>
                 <button onClick={handleExit} className={`${styles.actionButton} ${styles.exit}`}>책 덮기</button>
            </div>
        );
    };

    return (
        <div className={styles.viewContainer}>
            <div className={styles.bookContainer}>
                <div className={styles.pageContent}>
                    {isContentPage ? (
                        <>
                            <div className={styles.imageWrapper}>
                                <img src={pages[currentPage].imageUrl} alt={`삽화 ${currentPage + 1}`} className={styles.draftImage} />
                            </div>
                            <p 
                                className={`${styles.storyParagraph} ${isSpeaking ? styles.speaking : ''}`}
                                onClick={() => handleParagraphClick(pages[currentPage].text)}
                            >
                                {pages[currentPage].text}
                            </p>
                        </>
                    ) : (
                        // 마지막 페이지 (퀴즈 시작 기능) 렌더링
                        pages.length > 0 && renderLastPage()
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={() => handleNavigation('prev')} disabled={currentPage === 0} className={styles.navButton}>
                        이전
                    </button>
                    <div className={styles.pageIndicator}>
                        {currentPage + 1} / {totalPages}
                    </div>
                    <button onClick={() => handleNavigation('next')} disabled={currentPage === totalPages - 1} className={styles.navButton}>
                        다음
                    </button>
                </div>
            </div>
            {/* 모달 렌더링 부분은 제거됨 */}
        </div>
    );
};

export default QuizView;