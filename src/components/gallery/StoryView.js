import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './StoryView.module.css';
import { FaShareAlt, FaTags, FaTimes } from 'react-icons/fa';

const StoryView = () => {
    const { story_id } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    // --- 상태 관리 ---
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [ttsConfig, setTtsConfig] = useState({ voice: 'female', rate: 1, pitch: 1 });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [sharedTags, setSharedTags] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [currentTags, setCurrentTags] = useState([]);
    const [tagSuggestions, setTagSuggestions] = useState([]);

    // --- 데이터 로딩 및 초기 설정 ---
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

                // 1. 스토리 상세 정보 가져오기
                const storyRes = await fetch(`${BACKEND_URL}/api/v1/users/me/stories/${story_id}`, { headers });
                if (!storyRes.ok) throw new Error('동화 정보를 불러올 수 없습니다.');
                const storyData = await storyRes.json();
                setStory(storyData);

                // (가정) 별도의 API로 공유 상태와 태그를 가져오거나, storyData에 포함되어 있다고 가정합니다.
                // 이 부분은 실제 API 명세에 맞게 조정이 필요할 수 있습니다.
                setIsShared(storyData.is_shared || false);
                setSharedTags(storyData.tags || []);
                setCurrentTags(storyData.tags || []);

                // 2. 태그 제안 목록 가져오기
                const [predefinedTagsRes, dbTagsRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/v1/shares/share/tags`, { headers }),
                    fetch(`${BACKEND_URL}/api/v1/shares/share/db-tags`, { headers })
                ]);
                const predefinedTags = await predefinedTagsRes.json();
                const dbTags = await dbTagsRes.json();
                setTagSuggestions([...new Set([...predefinedTags, ...dbTags])]);

            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => window.speechSynthesis.cancel();
    }, [story_id, navigate, BACKEND_URL]);

    // --- [수정] 페이지네이션을 위한 데이터 가공 ---
    const pages = useMemo(() => {
        if (!story?.scenes) return [];
        
        const allPages = [];
        story.scenes.forEach(scene => {
            // 이미지 파일명만 추출
            const filename = scene.image_url.split('/').pop();
            const imageUrl = `${BACKEND_URL}/illustrations/${filename}`;
            
            // 텍스트를 문단으로 분리
            const paragraphs = scene.text.split('\n').filter(p => p.trim() !== '');
            
            // 각 문단을 별도의 페이지로 만듦
            paragraphs.forEach(p => {
                allPages.push({ text: p, imageUrl: imageUrl });
            });
        });
        return allPages;
    }, [story, BACKEND_URL]);

    const totalPages = pages.length > 0 ? pages.length + 1 : 1;

    // --- 핸들러 함수들 (이전과 동일) ---
    const handleNavigation = (direction) => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (direction === 'next' && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else if (direction === 'prev' && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    const handleExit = () => navigate(-1);

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
    
    // --- 태그 및 API 연동 함수 (이전과 동일) ---
    const handleAddTag = (tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !currentTags.includes(trimmedTag)) {
            setCurrentTags([...currentTags, trimmedTag]);
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
    };

    const handleTagInputChange = (e) => {
        const { value } = e.target;
        if (value.endsWith(',') || value.endsWith(' ')) {
            handleAddTag(value.slice(0, -1));
        } else {
            setTagInput(value);
        }
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    };
    
    const publishStory = async (isUpdate) => { /* 이전과 동일 */ 
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            const method = isUpdate ? 'PATCH' : 'POST';
            const body = JSON.stringify({ tags: currentTags });

            const response = await fetch(`${BACKEND_URL}/api/v1/shares/share/stories/${story_id}`, { method, headers, body });
            if (!response.ok) throw new Error('요청에 실패했습니다.');

            setIsShared(true);
            setSharedTags(currentTags);
            setIsModalOpen(false);
        } catch (err) {
            alert(err.message);
        }
    };
    
    const unpublishStory = async () => { /* 이전과 동일 */ 
        if (!window.confirm('정말로 공유를 취소하시겠습니까?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${BACKEND_URL}/api/v1/shares/share/stories/${story_id}`, { method: 'DELETE', headers });
            if (!response.ok) throw new Error('공유 취소에 실패했습니다.');

            setIsShared(false);
            setSharedTags([]);
        } catch (err) {
            alert(err.message);
        }
    };
    
    // --- 렌더링 로직 ---
    if (loading) return <div className={styles.loading}>동화책을 펼치는 중...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    const isContentPage = currentPage < pages.length;
    
    const renderLastPage = () => { /* 이전과 동일 */ 
        return (
            <div className={styles.finalChoicePage}>
                {isShared ? (
                    <>
                        <h3 className={styles.finalTitle}>커뮤니티에 공유됨</h3>
                        <div className={styles.tagDisplayArea}>
                            {sharedTags.length > 0 ? (
                                sharedTags.map(tag => <span key={tag} className={styles.tagItem}>#{tag}</span>)
                            ) : (
                                <p className={styles.finalSubtitle}>태그가 없습니다.</p>
                            )}
                        </div>
                        <div className={styles.buttonGroup}>
                            <button onClick={() => { setCurrentTags(sharedTags); setIsModalOpen(true); }} className={`${styles.actionButton} ${styles.edit}`}>태그 수정</button>
                            <button onClick={unpublishStory} className={`${styles.actionButton} ${styles.unpublish}`}>공유 취소</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className={styles.finalTitle}>야야기 끝!</h3>
                        <p className={styles.finalSubtitle}>이 동화를 다른 사람들과 공유해볼까요?</p>
                        <div className={styles.buttonGroup}>
                            <button onClick={() => { setCurrentTags([]); setIsModalOpen(true); }} className={`${styles.actionButton} ${styles.share}`}>
                                <FaShareAlt /> 커뮤니티에 공유하기
                            </button>
                        </div>
                    </>
                )}
                 <button onClick={handleExit} className={`${styles.actionButton} ${styles.exit}`}>책 덮기</button>
            </div>
        );
    };
    
    const renderShareModal = () => { /* 이전과 동일 */ 
        if (!isModalOpen) return null;
        const isUpdate = isShared;
        return (
            <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalIcon}><FaTags /></div>
                    <h2>{isUpdate ? '태그 수정하기' : '동화 공유하기'}</h2>
                    <p>태그를 추가하여 동화를 분류해보세요.</p>
                    <div className={styles.tagInputContainer}>
                        {currentTags.map(tag => (
                            <div key={tag} className={styles.tagPill}>
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)}><FaTimes /></button>
                            </div>
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="태그 입력 후 Enter 또는 , (쉼표)"
                            className={styles.tagInputField}
                        />
                    </div>
                    <div className={styles.tagSuggestionArea}>
                        <p>추천 태그:</p>
                        {tagSuggestions.filter(t => !currentTags.includes(t)).map(tag => (
                           <button key={tag} className={styles.suggestionPill} onClick={() => handleAddTag(tag)}>
                               {tag}
                           </button> 
                        ))}
                    </div>
                    <div className={styles.modalActions}>
                        <button onClick={() => setIsModalOpen(false)} className={`${styles.modalButton} ${styles.cancel}`}>취소</button>
                        <button onClick={() => publishStory(isUpdate)} className={`${styles.modalButton} ${styles.submit}`}>{isUpdate ? '수정 완료' : '공유하기'}</button>
                    </div>
                </div>
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
                        // 마지막 페이지 (공유 기능) 렌더링
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
            {renderShareModal()}
        </div>
    );
};

export default StoryView;