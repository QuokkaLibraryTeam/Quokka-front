import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../gallery/MyPage.module.css'; // MyPage.js의 스타일을 재사용합니다.

const QuizPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchOriginalStories = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const headers = { 'Authorization': `Bearer ${token}` };

                // 전래동화 목록 API를 호출합니다.
                const response = await fetch(`${BACKEND_URL}/api/v1/stories/originals`, { headers });
                if (!response.ok) {
                    throw new Error('전래동화 목록을 불러오는 데 실패했습니다.');
                }

                const data = await response.json();
                setStories(data.stories);
            } catch (error) {
                console.error("Error fetching original stories:", error);
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOriginalStories();
    }, [navigate, BACKEND_URL]);

    /**
     * 동화 선택 시 해당 퀴즈 페이지로 이동하는 함수
     * @param {number} storyId - 선택된 동화의 ID
     */
    const handleStorySelect = (storyId) => {
        navigate(`/view/quiz/${storyId}`);
    };

    const renderContent = () => {
        if (loading) {
            return <div className={styles.message}>퀴즈를 풀 동화책을 불러오는 중... 📚</div>;
        }
        if (stories.length === 0) {
            return <div className={styles.message}>퀴즈를 풀 수 있는 동화가 없어요. 😢</div>;
        }
        return (
            <div className={styles.cardGrid}>
                {stories.map(story => {
                    // API 응답에 맞춰 썸네일 이미지 URL을 구성합니다.
                    const imageUrlFromApi = story.scenes?.[0]?.image_url;
                    // *** 수정된 부분: 경로에서 파일명만 추출하여 URL 재구성 ***
                    const thumbnailUrl = imageUrlFromApi
                        ? `${BACKEND_URL}/illustrations/${imageUrlFromApi.split('/').pop()}`
                        : 'https://via.placeholder.com/150/EEEEEE/333333?text=No+Image';

                    return (
                        <div key={story.id} className={styles.storyCardWrapper}>
                            <div className={styles.storyCard} onClick={() => handleStorySelect(story.id)}>
                                <img src={thumbnailUrl} alt={story.title} className={styles.cardThumbnail} />
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardTitle}>{story.title}</h3>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.bookshelf}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>동화 퀴즈</h1>
                </div>
                <div className={styles.cardScrollArea}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;