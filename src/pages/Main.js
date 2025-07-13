import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Main.module.css';
import LazyImage from '../components/LazyImage';
import menu1 from '../assets/images/Menu1.png';
import menu2 from '../assets/images/Menu2.png';
import menu3 from '../assets/images/Menu3.png';

// 아이콘 컴포넌트
const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

const CogIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2" /><path d="M12 22v-2" /><path d="m17 20.66-1-1.73" /><path d="M11 10.27 7 3.34" />
      <path d="m20.66 17-1.73-1" /><path d="m3.34 7 1.73 1" /><path d="M14 12h8" /><path d="M2 12h2" />
      <path d="m20.66 7-1.73 1" /><path d="m3.34 17 1.73-1" /><path d="m17 3.34-1 1.73" /><path d="m11 13.73-4 6.93" />
    </svg>
);

// 함께 만들기 모달용 아이콘
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);


const Main = () => {
    const navigate = useNavigate();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isMultiplayerModalOpen, setMultiplayerModalOpen] = useState(false); // 함께하기 모달 상태
    const [title, setTitle] = useState('');
    
    const [ttsConfig, setTtsConfig] = useState({
        voice: 'female', rate: 1, pitch: 1,
    });

    useEffect(() => {
        const savedConfig = localStorage.getItem('ttsConfig');
        if (savedConfig) {
            setTtsConfig(JSON.parse(savedConfig));
        } else {
            localStorage.setItem('ttsConfig', JSON.stringify(ttsConfig));
        }
    }, []);
    
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/auth', { replace: true });
                return;
            }
            try {
                const response = await fetch('/api/v1/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('인증 실패');
            } catch (error) {
                localStorage.removeItem('access_token');
                navigate('/auth', { replace: true });
            }
        };
        checkAuthStatus();
    }, [navigate]);

    const handleStorySubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('동화 제목을 입력해주세요.');
            return;
        }
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch('/api/v1/users/me/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) throw new Error('스토리 생성에 실패했습니다.');
            const newStory = await response.json();
            navigate(`/chat/story/${newStory.id}`);
        } catch (error) {
            alert(error.message);
        }
    };
    
    const handleTtsConfigChange = (field, value) => {
        const newConfig = { ...ttsConfig, [field]: value };
        setTtsConfig(newConfig);
        localStorage.setItem('ttsConfig', JSON.stringify(newConfig));
    };

    // --- 함께하기 모달 선택 핸들러 ---
    const handleMultiplayerChoice = (action) => {
        setMultiplayerModalOpen(false);
        navigate('/multiplayer', { state: { action } });
    };

    return (
        <>
            <div className={styles.mainContainer}>
                <div className={styles.bookshelf}>
                    <div className={styles.shelf}>
                        <div className={`${styles.book} ${styles.bookImage}`} onClick={() => navigate('/mypage')}>
                             <LazyImage src={menu3} alt="내 서재" />
                            <span className={styles.bookTitle}>내가 만든<br/>동화 보기</span>
                        </div>
                        <div className={`${styles.book} ${styles.bookButton}`} onClick={() => navigate('/share')}> 
                            <span className={styles.bookTitle}>다른 사람 동화 구경하기</span>
                        </div>
                    </div>
                    <div className={styles.shelf}>
                        {/* '함께 만들기' 클릭 시 모달 열기 */}
                        <div className={`${styles.book} ${styles.bookButton}`} onClick={() => setMultiplayerModalOpen(true)}>
                            <span className={styles.bookTitle}>함께 만들기</span>
                        </div>
                        <div className={`${styles.book} ${styles.bookImage}`} onClick={() => setCreateModalOpen(true)}>
                            <LazyImage src={menu2} alt="새 동화 만들기" />
                            <span className={styles.bookTitle}>새 동화<br/>만들기</span>
                        </div>
                    </div>
                    <div className={styles.shelf}>
                        <div className={`${styles.book} ${styles.bookImage}`}>
                            <LazyImage src={menu1} alt="동화 학습" />
                            <span className={styles.bookTitle}>동화 학습</span>
                        </div>
                        <div className={`${styles.book} ${styles.settingsBook}`} onClick={() => setSettingsModalOpen(true)}>
                            <CogIcon className={styles.settingsIcon} />
                            <span className={styles.bookTitle}>설정 및 <br/>나의 정보</span>
                        </div>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><BookIcon /></div>
                        <h2>새로운 동화 만들기</h2>
                        <p>동화의 제목을 지어주세요!</p>
                        <form onSubmit={handleStorySubmit}>
                            <input type="text" className={styles.modalInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 용감한 쿼카의 모험" autoFocus />
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setCreateModalOpen(false)} className={styles.modalButton}>취소</button>
                                <button type="submit" className={`${styles.modalButton} ${styles.submitButton}`}>시작하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* --- 함께 만들기 모달 --- */}
            {isMultiplayerModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><UsersIcon /></div>
                        <h2>함께 만들기</h2>
                        <p>방을 만들거나, 친구의 방에 참여하세요!</p>
                        <div className={styles.modalActionsVertical}>
                            <button onClick={() => handleMultiplayerChoice('create')} className={`${styles.modalButton} ${styles.submitButton}`}>
                                방 만들기
                            </button>
                            <button onClick={() => handleMultiplayerChoice('join')} className={styles.modalButton}>
                                방 참여하기
                            </button>
                        </div>
                        <div className={styles.modalActions}>
                             <button type="button" onClick={() => setMultiplayerModalOpen(false)} className={`${styles.modalButton} ${styles.cancelButton}`}>취소</button>
                        </div>
                    </div>
                </div>
            )}

            {isSettingsModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><CogIcon className={styles.settingsIconInModal} /></div>
                        <h2>TTS 설정</h2>
                        <div className={styles.settingsGroup}>
                            <label className={styles.settingsLabel}>목소리</label>
                            <div className={styles.segmentedControl}>
                                <button className={`${styles.segmentButton} ${ttsConfig.voice === 'female' ? styles.active : ''}`} onClick={() => handleTtsConfigChange('voice', 'female')}>여성</button>
                                <button className={`${styles.segmentButton} ${ttsConfig.voice === 'male' ? styles.active : ''}`} onClick={() => handleTtsConfigChange('voice', 'male')}>남성</button>
                            </div>
                        </div>
                        <div className={styles.settingsGroup}>
                            <label className={styles.settingsLabel}>속도</label>
                            <div className={styles.sliderContainer}>
                                <span>느리게</span>
                                <input type="range" min="0.5" max="1.5" step="0.1" value={ttsConfig.rate} className={styles.slider} onChange={(e) => handleTtsConfigChange('rate', parseFloat(e.target.value))} />
                                <span>빠르게</span>
                            </div>
                        </div>
                        <div className={styles.settingsGroup}>
                            <label className={styles.settingsLabel}>음높이</label>
                            <div className={styles.sliderContainer}>
                                <span>낮게</span>
                                <input type="range" min="0.5" max="1.5" step="0.1" value={ttsConfig.pitch} className={styles.slider} onChange={(e) => handleTtsConfigChange('pitch', parseFloat(e.target.value))} />
                                <span>높게</span>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={() => setSettingsModalOpen(false)} className={`${styles.modalButton} ${styles.submitButton}`}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Main;
