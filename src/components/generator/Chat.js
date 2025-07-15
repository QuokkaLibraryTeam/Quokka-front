import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';
import View from './View'; // View 컴포넌트 import
//type:rejected 하면 필터링됨
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
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [showToast, setShowToast] = useState(false);
    
    // --- Ref 관리 ---
    const socketRef = useRef(null);
    const historyEndRef = useRef(null);
    // ⭐️ 1. messageHistory의 최신 값을 담을 ref 생성
    const messageHistoryRef = useRef(messageHistory);
    const BACKEND_URL = 'http://localhost:8000';

    // --- 효과 훅 ---

    // ⭐️ 2. messageHistory 상태가 변경될 때마다 ref의 .current 값을 업데이트
    useEffect(() => {
        messageHistoryRef.current = messageHistory;
    }, [messageHistory]);
    
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageHistory, isAiTyping]);
    
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        let isCancelled = false;

        const setupChat = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !storyId) {
                navigate('/auth');
                return;
            }

            try {
                // ... (기존 fetch 및 WebSocket 연결 로직은 동일)
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
                    setIsAiTyping(false);
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'question') {
                        // ⭐️ 3. state 대신 항상 최신 값을 가리키는 ref를 사용
                        const currentMessageHistory = messageHistoryRef.current;
                        const lastAiMessage = currentMessageHistory.slice().reverse().find(msg => msg.sender === 'ai');
                        
                        if (currentMessageHistory.length > 0 && lastAiMessage && lastAiMessage.text === data.text) {
                            setShowToast(true);
                        } else {
                            setMessageHistory(prev => [...prev, { sender: 'ai', text: data.text }]);
                        }

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

    // --- 핸들러 함수 (이하 동일) ---
    const handleAnswerSubmit = (text) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            setMessageHistory(prev => [...prev, { sender: 'user', text }]);
            socketRef.current.send(JSON.stringify({ text }));
            setExamples([]);
            setShowTextInput(false);
            setInputValue('');
            setIsAiTyping(true);
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
    
    // --- UI 렌더링 로직 (이하 동일) ---
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
        return <div className={styles.chatPage}><div className={styles.statusMessage}>AI와 연결 중입니다...</div></div>;
    }
    if (status === 'closed') {
        return <div className={styles.chatPage}><div className={styles.statusMessage}>연결이 끊어졌습니다. 페이지를 새로고침 해주세요.</div></div>;
    }
    if (draftData) {
        return <View draft={draftData} onReview={handleDraftReview} />;
    }
    
    return (
        <div className={styles.chatPage}>
            <div className={styles.chatBookshelf}>
                <div className={styles.messageHistory}>
                    {messageHistory.map((msg, index) => (
                        <div key={index} className={`${styles.bubble} ${msg.sender === 'ai' ? styles.aiBubble : styles.userBubble}`}>
                            {msg.text}
                        </div>
                    ))}
                    
                    {isAiTyping && (
                        <div className={`${styles.bubble} ${styles.aiBubble}`}>
                            <div className={styles.typingIndicator}>
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}

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

                <div className={styles.inputArea}>
                    {renderInputArea()}
                </div>
            </div>

            {showToast && (
                <div className={styles.toast}>
                    부적절한 단어가 포함되었어요!
                </div>
            )}
        </div>
    );
};

export default Chat;