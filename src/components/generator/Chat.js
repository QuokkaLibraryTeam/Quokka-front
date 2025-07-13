import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';
import View from './View'; // View 컴포넌트 import

const Chat = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();

    // --- 상태 관리 ---
    const [status, setStatus] = useState('initializing');
    const [messageHistory, setMessageHistory] = useState([]);
    const [examples, setExamples] = useState([]);
    const [illustrations, setIllustrations] = useState([]);
    const [draftData, setDraftData] = useState(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    
    const socketRef = useRef(null);
    const historyEndRef = useRef(null);
    const BACKEND_URL = 'http://localhost:8000';

    // --- 효과 훅 ---

    // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageHistory]);
    
    useEffect(() => {
        let isCancelled = false;

        const setupChat = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !storyId) {
                navigate('/auth');
                return;
            }

            try {
                // (생략: 기존 코드와 동일)
                const storyResponse = await fetch(`/api/v1/users/me/stories/${storyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isCancelled) return;
                if (!storyResponse.ok) throw new Error('동화 정보를 가져오는데 실패했습니다.');
                
                const storyData = await storyResponse.json();
                const storyTitle = storyData.title;

                const initChatResponse = await fetch(`/api/v1/stories/${storyId}/chat`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isCancelled) return;
                if (!initChatResponse.ok) throw new Error('채팅방을 여는 데 실패했습니다.');

                const chatSessionData = await initChatResponse.json();
                const sessionKey = chatSessionData.session_key;
                if (!sessionKey) throw new Error('세션 키를 받지 못했습니다.');

                setStatus('connecting');
                const wsUrl = `ws://localhost:8000/api/v1/ws/story/${sessionKey}`;
                socketRef.current = new WebSocket(wsUrl, ['jwt', token]);

                socketRef.current.onopen = () => {
                    if (isCancelled) return;
                    setStatus('open');
                    socketRef.current.send(JSON.stringify({ type: 'scene', text: storyTitle }));
                };

                socketRef.current.onmessage = (event) => {
                    if (isCancelled) return;
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'question') {
                        setMessageHistory(prev => [...prev, { sender: 'ai', text: data.text }]);
                        setExamples(data.examples || []);
                        setIllustrations([]);
                        setDraftData(null);
                        setShowTextInput(false);
                    } else if (data.type === 'illustration') {
                        setIllustrations(data.urls || []);
                        setExamples([]);
                        setDraftData(null);
                    } else if (data.type === 'draft') {
                        setDraftData(data);
                        setExamples([]);
                        setIllustrations([]);
                    }
                };

                socketRef.current.onclose = () => { if (!isCancelled) setStatus('closed'); };
                socketRef.current.onerror = (error) => { if (!isCancelled) console.error('웹소켓 에러:', error); };

            } catch (error) {
                if (!isCancelled) {
                    console.error(error);
                    alert(error.message);
                    setStatus('closed');
                }
            }
        };

        setupChat();

        return () => {
            isCancelled = true;
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [storyId, navigate]);

    // --- 핸들러 함수 (생략: 기존 코드와 동일) ---
    const handleAnswerSubmit = (text) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            setMessageHistory(prev => [...prev, { sender: 'user', text }]);
            socketRef.current.send(JSON.stringify({ text }));
            setExamples([]);
            setShowTextInput(false);
            setInputValue('');
        }
    };
    
    const handleIllustrationChoice = (choiceIndex) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'scene', text: choiceIndex }));
            setIllustrations([]);
        }
    };

    const handleDraftReview = (decision) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: decision }));
            setDraftData(null);
        }
    };

    const handleDirectInputClick = () => setShowTextInput(true);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            handleAnswerSubmit(inputValue);
        }
    };
    
    // --- UI 렌더링 로직 ---

    const renderInputArea = () => {
        if (illustrations.length > 0) return null;

        if (showTextInput) {
            return (
                <form onSubmit={handleFormSubmit} className={styles.textInputBox}>
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="직접 입력하세요..." autoFocus />
                    <button type="submit">전송</button>
                </form>
            );
        }
        if (examples.length > 0) {
            return (
                <div className={styles.exampleGrid}>
                    {examples.map((ex, i) => (
                        <button key={i} className={styles.choiceButton} onClick={() => handleAnswerSubmit(ex)}>{ex}</button>
                    ))}
                    <button className={`${styles.choiceButton} ${styles.directInputButton}`} onClick={handleDirectInputClick}>내가 쓸게!</button>
                </div>
            );
        }
        return null;
    }

    if (status === 'initializing' || status === 'connecting') {
        // 로딩 메시지도 chatPage 스타일을 적용해 일관성을 유지합니다.
        return (
            <div className={styles.chatPage}>
                <div className={styles.statusMessage}>AI와 연결 중입니다...</div>
            </div>
        );
    }
    if (status === 'closed') {
        return (
            <div className={styles.chatPage}>
                <div className={styles.statusMessage}>연결이 끊어졌습니다. 페이지를 새로고침 해주세요.</div>
            </div>
        );
    }

    if (draftData) {
        return <View draft={draftData} onReview={handleDraftReview} />;
    }
    
    return (
        <div className={styles.chatPage}>
            {/* --- ⭐️ 수정된 부분 시작 ⭐️ --- */}
            {/* 1. chatBookshelf 컨테이너 추가 */}
            <div className={styles.chatBookshelf}>
                {/* 메시지 기록 영역 */}
                <div className={styles.messageHistory}>
                    {messageHistory.map((msg, index) => (
                        <div key={index} className={`${styles.bubble} ${msg.sender === 'ai' ? styles.aiBubble : styles.userBubble}`}>
                            {msg.text}
                        </div>
                    ))}
                    {/* 일러스트 선택 UI */}
                    {illustrations.length > 0 && (
                         <div className={styles.illustrationContainer}>
                            <h4>마음에 드는 삽화를 골라주세요</h4>
                            <div className={styles.illustrationGrid}>
                                {illustrations.map((url, index) => {
                                    const filename = url.split('/').pop();
                                    const imageUrl = `${BACKEND_URL}/illustrations/${filename}`;
                                    return (
                                        <img
                                            key={index}
                                            src={imageUrl}
                                            alt={`동화 삽화 ${index + 1}`}
                                            className={styles.illustrationImage}
                                            onClick={() => handleIllustrationChoice(index)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div ref={historyEndRef} />
                </div>

                {/* 하단 입력 영역 */}
                <div className={styles.inputArea}>
                    {renderInputArea()}
                </div>
            </div>
            {/* --- ⭐️ 수정된 부분 끝 ⭐️ --- */}
        </div>
    );
};

export default Chat;