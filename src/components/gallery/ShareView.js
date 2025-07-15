import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './StoryView.module.css';
import { FaPaperPlane, FaEdit, FaTrash } from 'react-icons/fa';

const ShareView = () => {
    const { story_id } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    // --- 상태 관리 ---
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);

    // --- 댓글 관련 상태 ---
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState({ id: null, text: '' });

    // --- 삭제 확인 모달 상태 ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const myNickname = localStorage.getItem('nickname');

    // --- 날짜 포매팅 함수 ---
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        // YYYY.MM.DD HH:MM 형식으로 변환
        return date.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
        }).slice(0, -1) + ' ' + date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // --- 데이터 로딩 ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [storyRes, commentsRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/v1/shares/shared/stories/${story_id}`),
                    fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${story_id}`)
                ]);

                if (!storyRes.ok) throw new Error('동화 정보를 불러올 수 없습니다.');
                if (!commentsRes.ok) throw new Error('댓글 정보를 불러올 수 없습니다.');

                const storyData = await storyRes.json();
                const commentsData = await commentsRes.json();

                setStory(storyData.story);
                setComments(commentsData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => window.speechSynthesis.cancel();
    }, [story_id, BACKEND_URL]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${story_id}`);
            if (!res.ok) throw new Error('댓글 로딩 실패');
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error(err);
        }
    };

    const pages = useMemo(() => {
        if (!story?.scenes) return [];
        const allPages = [];
        story.scenes.forEach(scene => {
            const filename = scene.image_url.split('/').pop();
            const imageUrl = `${BACKEND_URL}/illustrations/${filename}`;
            allPages.push({ text: scene.text, imageUrl: imageUrl });
        });
        return allPages;
    }, [story, BACKEND_URL]);

    const totalPages = pages.length > 0 ? pages.length + 1 : 1;

    // --- 핸들러 ---
    const handleNavigation = (direction) => {
        if (direction === 'next' && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else if (direction === 'prev' && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };
    const handleExit = () => navigate(-1);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');
        try {
            await fetch(`${BACKEND_URL}/api/v1/comments/community/comment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ story_id: parseInt(story_id), text: newComment }),
            });
            setNewComment('');
            fetchComments();
        } catch (err) { alert('댓글 작성에 실패했습니다.'); }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editingComment.text.trim()) return;
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');
        try {
            await fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${commentId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editingComment.text }),
            });
            setEditingComment({ id: null, text: '' });
            fetchComments();
        } catch (err) { alert('댓글 수정에 실패했습니다.'); }
    };

    const openDeleteModal = (commentId) => {
        setCommentToDelete(commentId);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => setIsDeleteModalOpen(false);

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;
        const token = localStorage.getItem('access_token');
        if (!token) return alert('로그인이 필요합니다.');
        try {
            await fetch(`${BACKEND_URL}/api/v1/comments/community/comment/${commentToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchComments();
        } catch (err) {
            alert('댓글 삭제에 실패했습니다.');
        } finally {
            closeDeleteModal();
        }
    };

    // --- 렌더링 로직 ---
    if (loading) return <div className={styles.loading}>동화책을 펼치는 중... 📖</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    const renderDeleteModal = () => {
        if (!isDeleteModalOpen) return null;
        return (
            <div className={styles.modalBackdrop}>
                <div className={styles.modalContent}>
                    <div className={`${styles.modalIcon} ${styles.deleteModalIcon}`}><FaTrash /></div>
                    <h2>댓글 삭제</h2>
                    <p>정말로 이 댓글을 삭제하시겠습니까?<br/>삭제된 내용은 복구할 수 없습니다.</p>
                    <div className={styles.modalActions}>
                        <button onClick={closeDeleteModal} className={`${styles.modalButton} ${styles.cancel}`}>취소</button>
                        <button onClick={confirmDeleteComment} className={`${styles.modalButton} ${styles.deleteConfirmButton}`}>삭제</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderLastPage = () => (
        <div className={styles.lastPageContainer}>
            <h3 className={styles.finalTitle}>이야기에 대한 생각 나누기</h3>
            <div className={styles.commentsContent}>
                <ul className={styles.commentList}>
                    {comments.length > 0 ? comments.map(comment => (
                        <li key={comment.id} className={styles.commentCard}>
                            {editingComment.id === comment.id ? (
                                <div className={styles.editingForm}>
                                    <textarea
                                        value={editingComment.text}
                                        onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                        className={styles.editingInput}
                                        rows="2"
                                    />
                                    <div className={styles.editingActions}>
                                        <button onClick={() => handleUpdateComment(comment.id)}>저장</button>
                                        <button onClick={() => setEditingComment({ id: null, text: '' })}>취소</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.commentHeader}>
                                        <div className={styles.commentAuthorInfo}>
                                            <span className={styles.commentAuthor}>{comment.user_nickname}</span>
                                            <span className={styles.commentTimestamp}>{formatTimestamp(comment.created_at)}</span>
                                        </div>
                                        {myNickname === comment.user_nickname && (
                                            <div className={styles.commentActions}>
                                                <button onClick={() => setEditingComment({ id: comment.id, text: comment.text })}><FaEdit/></button>
                                                <button onClick={() => openDeleteModal(comment.id)}><FaTrash/></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className={styles.commentBody}>{comment.text}</p>
                                </>
                            )}
                        </li>
                    )) : <p className={styles.commentMessage}>첫 번째 댓글을 남겨<br/>이야기를 시작해보세요!</p>}
                </ul>
            </div>
            <form onSubmit={handlePostComment} className={styles.commentForm}>
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="따뜻한 댓글을 남겨주세요..."/>
                <button type="submit"><FaPaperPlane/></button>
            </form>
            <button onClick={handleExit} className={`${styles.actionButton} ${styles.exit}`}>책 덮기</button>
        </div>
    );

    return (
        <div className={styles.viewContainer}>
            <div className={styles.bookContainer}>
                {currentPage < pages.length ? (
                    <div className={styles.pageContent}>
                        <div className={styles.imageWrapper}>
                            <img src={pages[currentPage]?.imageUrl} alt={`삽화 ${currentPage + 1}`} className={styles.draftImage} />
                        </div>
                        <p className={styles.storyParagraph}>
                            {pages[currentPage]?.text.split('\n').map((line, index) => (
                                <React.Fragment key={index}>{line}<br/></React.Fragment>
                            ))}
                        </p>
                    </div>
                ) : (
                    renderLastPage()
                )}

                <div className={styles.footer}>
                    <button onClick={() => handleNavigation('prev')} disabled={currentPage === 0} className={styles.navButton}>이전</button>
                    <div className={styles.pageIndicator}>{currentPage + 1} / {totalPages}</div>
                    <button onClick={() => handleNavigation('next')} disabled={currentPage >= totalPages - 1} className={styles.navButton}>다음</button>
                </div>
            </div>
            {renderDeleteModal()}
        </div>
    );
};

export default ShareView;