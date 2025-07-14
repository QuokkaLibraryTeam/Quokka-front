import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyPage.module.css';
import { FaTrashAlt } from 'react-icons/fa'; // 아이콘 추가

const MyPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false); // 삭제 진행 중 상태 추가

    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchStories = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const headers = { 'Authorization': `Bearer ${token}` };
                
                const response = await fetch(`${BACKEND_URL}/api/v1/users/me/stories`, { headers });
                if (!response.ok) throw new Error('내가 만든 동화 목록을 불러오는 데 실패했습니다.');
                
                const data = await response.json();
                const storyDetailsPromises = data.stories.map(story =>
                    fetch(`${BACKEND_URL}/api/v1/users/me/stories/${story.id}`, { headers })
                        .then(res => res.ok ? res.json() : null)
                );
                const detailedStories = (await Promise.all(storyDetailsPromises)).filter(Boolean);
                
                setStories(detailedStories);
            } catch (error) {
                console.error("Error fetching stories:", error);
                // 에러 발생 시 alert 대신 다른 방식을 사용하는 것이 좋습니다 (예: 토스트 메시지)
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, [navigate, BACKEND_URL]);

    /**
     * [수정] 삭제 확인 모달을 여는 함수
     */
    const openDeleteModal = (e, storyId) => {
        e.stopPropagation();
        setStoryToDelete(storyId);
        setIsModalOpen(true);
    };

    /**
     * [신규] 삭제 확인 모달을 닫는 함수
     */
    const closeDeleteModal = () => {
        if (isDeleting) return; // 삭제 중에는 닫기 비활성화
        setIsModalOpen(false);
        setStoryToDelete(null);
    };

    /**
     * [수정] 동화 삭제를 최종 실행하는 함수
     */
    const confirmDelete = async () => {
        if (!storyToDelete || isDeleting) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
            
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${BACKEND_URL}/api/v1/users/me/stories/${storyToDelete}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || '동화 삭제에 실패했습니다.');
            }

            // 삭제 성공 시, 화면에서도 즉시 해당 동화를 제거
            setStories(prevStories => prevStories.filter(story => story.id !== storyToDelete));
            closeDeleteModal();

        } catch (error) {
            console.error("Error deleting story:", error);
            // 사용자에게 에러 알림 (alert 대신 다른 UI/UX 고려)
            alert(error.message); 
        } finally {
            setIsDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className={styles.message}>나의 동화책을 불러오는 중... 📚</div>;
        }
        if (stories.length === 0) {
            return <div className={styles.message}>아직 만든 동화가 없어요.<br/>새로운 동화를 만들어보세요! ✨</div>;
        }
        return (
            <div className={styles.cardGrid}>
                {stories.map(story => {
                    const imageUrlFromApi = story.scenes?.[0]?.image_url;
                    const thumbnailUrl = imageUrlFromApi 
                        ? `${BACKEND_URL}/illustrations/${imageUrlFromApi.split('/').pop()}`
                        : 'https://via.placeholder.com/150/EEEEEE/333333?text=No+Image';
                    
                    return (
                        <div key={story.id} className={styles.storyCardWrapper}>
                            <div className={styles.storyCard} onClick={() => navigate(`/view/story/${story.id}`)}>
                                <img src={thumbnailUrl} alt={story.title} className={styles.cardThumbnail} />
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardTitle}>{story.title}</h3>
                                </div>
                            </div>
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => openDeleteModal(e, story.id)}
                                aria-label={`${story.title} 삭제`}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    /**
     * [신규] 삭제 확인 모달 렌더링 함수
     */
    const renderDeleteModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className={styles.modalBackdrop} onClick={closeDeleteModal}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalIcon}><FaTrashAlt /></div>
                    <h2>동화 삭제</h2>
                    <p>정말로 이 동화를 삭제하시겠습니까?<br/>삭제된 동화는 다시 복구할 수 없습니다.</p>
                    <div className={styles.modalActions}>
                        <button 
                            onClick={closeDeleteModal} 
                            className={`${styles.modalButton} ${styles.cancelButton}`}
                            disabled={isDeleting}
                        >
                            취소
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className={`${styles.modalButton} ${styles.submitButton}`}
                            disabled={isDeleting}
                        >
                            {isDeleting ? '삭제 중...' : '삭제'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.bookshelf}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>내가 만든 동화</h1>
                </div>
                <div className={styles.cardScrollArea}>
                    {renderContent()}
                </div>
            </div>
            {/* 모달 렌더링 */}
            {renderDeleteModal()}
        </div>
    );
};

export default MyPage;