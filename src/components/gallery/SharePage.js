import React, { useState, useEffect } from 'react';
import styles from './SharePage.module.css';

const SharePage = () => {
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

    useEffect(() => {
        const fetchStoriesAndLikes = async () => {
            setLoading(true);
            try {
                let url = `${BACKEND_URL}/api/v1/shares/shared/stories`;
                if (selectedTag) url += `?tag=${encodeURIComponent(selectedTag)}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('동화 로딩 실패');
                const storiesData = await response.json();
                setStories(storiesData);

                if (storiesData.length > 0) {
                    const token = localStorage.getItem('access_token');
                    const authHeaders = { 'Authorization': `Bearer ${token}` };

                    const dataPromises = storiesData.map(sharedStory => {
                        const storyId = sharedStory.story.id;
                        const countPromise = fetch(`${BACKEND_URL}/api/v1/likes/community/like/${storyId}`).then(res => res.ok ? res.json() : { likes: 0 });
                        const statusPromise = token ? fetch(`${BACKEND_URL}/api/v1/likes/community/like/me/${storyId}`, { headers: authHeaders }).then(res => res.ok ? res.json() : { liked: false }) : Promise.resolve({ liked: false });
                        return Promise.all([countPromise, statusPromise]).then(([countData, statusData]) => ({ storyId, count: countData.likes || 0, isLiked: statusData.liked || false }));
                    });

                    const allData = await Promise.all(dataPromises);
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

    const handleLikeToggle = async (storyId) => {
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');
        const isLiked = !!likedStories[storyId];
        const originalCount = likeCounts[storyId] || 0;
        setLikedStories(prev => ({ ...prev, [storyId]: !isLiked }));
        setLikeCounts(prev => ({ ...prev, [storyId]: isLiked ? originalCount - 1 : originalCount + 1 }));
        try {
            await fetch(`${BACKEND_URL}/api/v1/likes/community/like/${storyId}`, {
                method: isLiked ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
            setLikedStories(prev => ({ ...prev, [storyId]: isLiked }));
            setLikeCounts(prev => ({ ...prev, [storyId]: originalCount }));
        }
    };

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
        <div className={styles.mainContainer}>
            <div className={styles.contentWrapper}>
                <h1 className={styles.pageTitle}>모두의 동화</h1>
                <div className={styles.tagContainer}>
                    <button onClick={() => setSelectedTag(null)} className={`${styles.tagButton} ${!selectedTag ? styles.active : ''}`}>#전체</button>
                    {tags.map(tag => <button key={tag} onClick={() => setSelectedTag(p => p === tag ? null : tag)} className={`${styles.tagButton} ${selectedTag === tag ? styles.active : ''}`}>#{tag}</button>)}
                </div>

                {loading && <div className={styles.message}>다른 친구들의 동화를 찾고 있어요...</div>}
                {error && <div className={styles.message}>{error}</div>}
                {!loading && !error && (
                    <div className={styles.storyList}>
                        {stories.map(sharedStory => {
                            const story = sharedStory.story;
                            const isLiked = !!likedStories[story.id];
                            const areCommentsVisible = !!visibleComments[story.id];
                            const thumbnailUrl = story.scenes?.[0]?.image_url
                                ? `${BACKEND_URL}/illustrations/${story.scenes[0].image_url.split('/').pop()}`
                                : 'https://placehold.co/420x240/C0946C/4F3222?text=Quokka';

                            return (
                                <div key={sharedStory.id} className={styles.storyItem}>
                                    <div className={styles.storyHeader}>
                                        <img src={thumbnailUrl} alt={story.title} className={styles.storyImage} />
                                        <div className={styles.titleOverlay}>
                                            <p className={styles.storyTitle}>{story.title || '제목 없음'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.storyContent}>
                                        <div className={styles.storyActions}>
                                            <button onClick={() => handleLikeToggle(story.id)} className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}>
                                                ❤️ {likeCounts[story.id] || 0}
                                            </button>
                                            <button onClick={() => handleToggleComments(story.id)} className={styles.actionButton}>
                                                💬 댓글 {areCommentsVisible ? '숨기기' : '보기'}
                                            </button>
                                        </div>
                                        {areCommentsVisible && (
                                            <div className={styles.commentsSection}>
                                                {commentsLoading[story.id] ? <p className={styles.commentMessage}>댓글 로딩 중...</p> : (
                                                    <ul className={styles.commentList}>
                                                        {(commentsData[story.id] || []).length > 0 ? commentsData[story.id].map(comment => (
                                                            <li key={comment.id} className={styles.commentItem}><strong>{comment.user_nickname}:</strong> {comment.text}</li>
                                                        )) : <p className={styles.commentMessage}>아직 댓글이 없습니다.</p>}
                                                    </ul>
                                                )}
                                                <form onSubmit={(e) => handlePostComment(e, story.id)} className={styles.commentForm}>
                                                    <input type="text" value={newCommentText[story.id] || ''} onChange={(e) => setNewCommentText(p => ({...p, [story.id]: e.target.value}))} placeholder="따뜻한 댓글을 남겨주세요..." />
                                                    <button type="submit">등록</button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharePage;
