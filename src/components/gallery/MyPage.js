import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyPage.module.css';

const MyPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:8000'; // 백엔드 서버 주소

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const token = localStorage.getItem('access_token'); 
                if (!token) {
                    console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
                    setLoading(false);
                    return;
                }
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                };
                const response = await fetch(`${BACKEND_URL}/api/v1/users/me/stories`, { headers });
                if (!response.ok) {
                    throw new Error('Failed to fetch story list');
                }
                const data = await response.json();
                const storyDetailsPromises = data.stories.map(story =>
                    fetch(`${BACKEND_URL}/api/v1/users/me/stories/${story.id}`, { headers }).then(res => res.json())
                );
                const detailedStories = await Promise.all(storyDetailsPromises);
                setStories(detailedStories);
            } catch (error) {
                console.error("Error fetching stories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, [navigate]);

    /**
     * [신규] 동화 삭제 핸들러
     */
    const handleDelete = async (storyIdToDelete) => {
        // 사용자에게 삭제 여부 확인
        if (!window.confirm("정말로 이 동화를 삭제하시겠습니까?")) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            const response = await fetch(`${BACKEND_URL}/api/v1/users/me/stories/${storyIdToDelete}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('동화 삭제에 실패했습니다.');
            }

            // 삭제 성공 시, 화면에서도 해당 동화를 제거
            setStories(prevStories => prevStories.filter(story => story.id !== storyIdToDelete));
            alert('동화가 성공적으로 삭제되었습니다.');

        } catch (error) {
            console.error("Error deleting story:", error);
            alert(error.message);
        }
    };
    
    if (loading) {
        return <div className={styles.loading}>동화책을 불러오는 중...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>←</button>
                <h1 className={styles.title}>내가 만든 동화</h1>
            </div>
            <div className={styles.storyGrid}>
                {stories.map((story, index) => {
                    let thumbnailUrl = 'https://via.placeholder.com/150';
                    const imageUrlFromApi = story.scenes?.[0]?.image_url;

                    if (imageUrlFromApi) {
                        const filename = imageUrlFromApi.split('/').pop();
                        thumbnailUrl = `${BACKEND_URL}/illustrations/${filename}`;
                    }
                    return (
                        <div key={story.id} className={styles.storyItem}>
                             {/* --- 삭제 버튼 추가 --- */}
                            <button 
                                className={styles.deleteButton} 
                                onClick={() => handleDelete(story.id)}
                            >
                                ×
                            </button>
                            <img src={thumbnailUrl} alt={story.title} className={styles.storyImage} />
                            <p className={styles.storyTitle}>{`동화 ${index + 1}`}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyPage;