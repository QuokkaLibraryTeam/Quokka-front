import React, { useState, useEffect } from 'react';
import styles from './SharePage.module.css';

const SharePage = () => {
    // 상태 선언 (변경 없음)
    const [tags, setTags] = useState([]);
    const [stories, setStories] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [likedStories, setLikedStories] = useState({});
    const [visibleComments, setVisibleComments] = useState({});
    const [commentsData, setCommentsData] = useState({});
    const [commentsLoading, setCommentsLoading] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [likeCounts, setLikeCounts] = useState({});

    const BACKEND_URL = 'http://localhost:8000';

    // 태그 목록만 fetch 하도록 수정
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const [predefinedTagsRes, dbTagsRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/v1/shares/share/tags`),
                    fetch(`${BACKEND_URL}/api/v1/shares/share/db-tags`)
                ]);
                if (!predefinedTagsRes.ok || !dbTagsRes.ok) throw new Error('태그 로딩 실패');
                const predefinedTags = await predefinedTagsRes.json();
                const dbTags = await dbTagsRes.json();
                setTags([...new Set([...predefinedTags, ...dbTags])]);
            } catch (err) { console.error(err); setError(err.message); }
        };
        fetchTags();
    }, []);

    // 동화 목록, 좋아요 개수, 좋아요 여부 fetch
    useEffect(() => {
        const fetchStoriesAndLikes = async () => {
            setLoading(true);
            try {
                // 1. 동화 목록 가져오기
                let url = `${BACKEND_URL}/api/v1/shares/shared/stories`;
                if (selectedTag) url += `?tag=${encodeURIComponent(selectedTag)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('동화 로딩 실패');
                const storiesData = await response.json();
                setStories(storiesData);

                // 2. 각 동화의 좋아요 개수와 '나의 좋아요' 상태 가져오기
                if (storiesData.length > 0) {
                    const token = localStorage.getItem('access_token');
                    const authHeaders = { 'Authorization': `Bearer ${token}` };

                    const dataPromises = storiesData.map(sharedStory => {
                        const storyId = sharedStory.story.id;
                        const countPromise = fetch(`${BACKEND_URL}/api/v1/likes/community/like/${storyId}`)
                            .then(res => res.ok ? res.json() : { likes: 0 });
                        
                        // 로그인 상태일 때만 '좋아요 여부' API 호출
                        const statusPromise = token 
                            ? fetch(`${BACKEND_URL}/api/v1/likes/community/like/me/${storyId}`, { headers: authHeaders })
                                .then(res => res.ok ? res.json() : { liked: false })
                            : Promise.resolve({ liked: false });

                        return Promise.all([countPromise, statusPromise])
                            .then(([countData, statusData]) => ({
                                storyId,
                                count: countData.likes || 0,
                                isLiked: statusData.liked || false
                            }));
                    });

                    const allData = await Promise.all(dataPromises);

                    // 3. 가져온 정보로 상태 업데이트
                    const newLikeCounts = {};
                    const newLikedStories = {};
                    allData.forEach(({ storyId, count, isLiked }) => {
                        newLikeCounts[storyId] = count;
                        newLikedStories[storyId] = isLiked;
                    });
                    setLikeCounts(newLikeCounts);
                    setLikedStories(newLikedStories);
                }
            } catch (err) { 
                console.error(err); 
                setError(err.message); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchStoriesAndLikes();
    }, [selectedTag]);

    // 좋아요 토글 핸들러 (변경 없음)
    const handleLikeToggle = async (storyId) => {
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');

        const isLiked = !!likedStories[storyId];
        const originalCount = likeCounts[storyId] || 0;

        setLikedStories(prev => ({ ...prev, [storyId]: !isLiked }));
        setLikeCounts(prev => ({ ...prev, [storyId]: isLiked ? originalCount - 1 : originalCount + 1 }));

        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/likes/community/like/${storyId}`, {
                method: isLiked ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                setLikedStories(prev => ({ ...prev, [storyId]: isLiked }));
                setLikeCounts(prev => ({ ...prev, [storyId]: originalCount }));
            }
        } catch (err) {
            console.error(err);
            setLikedStories(prev => ({ ...prev, [storyId]: isLiked }));
            setLikeCounts(prev => ({ ...prev, [storyId]: originalCount }));
        }
    };
    
    // 댓글 관련 핸들러 (변경 없음)
    const handleToggleComments = async (storyId) => {
        const isVisible = !visibleComments[storyId];
        setVisibleComments({ ...visibleComments, [storyId]: isVisible });
        if (isVisible && !commentsData[storyId]) {
            setCommentsLoading({ ...commentsLoading, [storyId]: true });
            try {
                const response = await fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${storyId}`);
                const data = await response.json();
                setCommentsData(prev => ({ ...prev, [storyId]: data }));
            } catch (err) { 
                console.error(err); 
            } finally { 
                setCommentsLoading({ ...commentsLoading, [storyId]: false }); 
            }
        }
    };

    const handlePostComment = async (e, storyId) => {
        e.preventDefault();
        const text = newCommentText[storyId] || '';
        if (!text.trim()) return;
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');
        try {
            await fetch(`${BACKEND_URL}/api/v1/comments/community/comment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ story_id: storyId, text })
            });
            setNewCommentText(prev => ({ ...prev, [storyId]: '' }));
            const response = await fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${storyId}`);
            const data = await response.json();
            setCommentsData(prev => ({ ...prev, [storyId]: data }));
        } catch (err) { console.error(err); }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>모두의 동화</h1>
            <div className={styles.tagContainer}>
                <button onClick={() => setSelectedTag(null)} className={`${styles.tagButton} ${!selectedTag ? styles.active : ''}`}>전체</button>
                {tags.map(tag => <button key={tag} onClick={() => setSelectedTag(p => p === tag ? null : tag)} className={`${styles.tagButton} ${selectedTag === tag ? styles.active : ''}`}>#{tag}</button>)}
            </div>

            {loading && <div className={styles.loading}>이야기를 불러오는 중...</div>}
            {error && <div className={styles.error}>{error}</div>}
            {!loading && !error && (
                <div className={styles.storyGrid}>
                    {stories.map(sharedStory => {
                        const story = sharedStory.story;
                        const isLiked = !!likedStories[story.id];
                        const areCommentsVisible = !!visibleComments[story.id];
                        let thumbnailUrl = 'https://via.placeholder.com/150';
                        if (story.scenes?.[0]?.image_url) {
                            thumbnailUrl = `${BACKEND_URL}/illustrations/${story.scenes[0].image_url.split('/').pop()}`;
                        }

                        return (
                            <div key={sharedStory.id} className={styles.storyItem}>
                                <img src={thumbnailUrl} alt={story.title} className={styles.storyImage} />
                                <div className={styles.storyInfo}>
                                    <p className={styles.storyTitle}>{story.title || '제목 없음'}</p>
                                    <div className={styles.storyActions}>
                                        <button onClick={() => handleLikeToggle(story.id)} className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}>
                                            ❤️ {likeCounts[story.id] || 0}
                                        </button>
                                        <button onClick={() => handleToggleComments(story.id)} className={styles.actionButton}>
                                            💬 댓글 {areCommentsVisible ? '숨기기' : '보기'}
                                        </button>
                                    </div>
                                </div>
                                {areCommentsVisible && (
                                    <div className={styles.commentsSection}>
                                        {commentsLoading[story.id] ? <p>댓글 로딩 중...</p> : (
                                            <ul className={styles.commentList}>
                                                {(commentsData[story.id] || []).length > 0 ? commentsData[story.id].map(comment => (
                                                    <li key={comment.id} className={styles.commentItem}><strong>{comment.user_nickname}:</strong> {comment.text}</li>
                                                )) : <p>아직 댓글이 없습니다.</p>}
                                            </ul>
                                        )}
                                        <form onSubmit={(e) => handlePostComment(e, story.id)} className={styles.commentForm}>
                                            <input type="text" value={newCommentText[story.id] || ''} onChange={(e) => setNewCommentText(p => ({...p, [story.id]: e.target.value}))} placeholder="댓글을 입력하세요..." />
                                            <button type="submit">등록</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SharePage;