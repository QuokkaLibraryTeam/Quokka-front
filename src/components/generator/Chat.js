import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';
import View from './View'; // View 컴포넌트 import

const Chat = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [status, setStatus] = useState('initializing');
    const [question, setQuestion] = useState('');
    const [examples, setExamples] = useState([]);
    const [illustrations, setIllustrations] = useState([]);
    const [draftData, setDraftData] = useState(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    
    const socketRef = useRef(null);
    const BACKEND_URL = 'http://localhost:8000'; // 백엔드 서버 주소

    useEffect(() => {
        // 경합 상태(Race Condition) 방지를 위한 플래그
        let isCancelled = false;

        const setupChat = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !storyId) {
                navigate('/auth');
                return;
            }

            try {
                // 1. GET: 동화 제목 가져오기
                const storyResponse = await fetch(`/api/v1/users/me/stories/${storyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isCancelled) return;
                if (!storyResponse.ok) throw new Error('동화 정보를 가져오는데 실패했습니다.');
                
                const storyData = await storyResponse.json();
                const storyTitle = storyData.title;

                // 2. POST: 채팅 세션 초기화 및 session_key 획득
                const initChatResponse = await fetch(`/api/v1/stories/${storyId}/chat`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isCancelled) return;
                if (!initChatResponse.ok) throw new Error('채팅방을 여는 데 실패했습니다.');

                const chatSessionData = await initChatResponse.json();
                const sessionKey = chatSessionData.session_key;
                if (!sessionKey) throw new Error('세션 키를 받지 못했습니다.');

                // 3. session_key로 웹소켓 연결
                setStatus('connecting');
                const wsUrl = `ws://localhost:8000/api/v1/ws/story/${sessionKey}`;
                socketRef.current = new WebSocket(wsUrl, ['jwt', token]);

                socketRef.current.onopen = () => {
                    if (isCancelled) return;
                    setStatus('open');
                    const initialMessage = { type: 'scene', text: storyTitle };
                    socketRef.current.send(JSON.stringify(initialMessage));
                };

                socketRef.current.onmessage = (event) => {
                    if (isCancelled) return;
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'question') {
                        setDraftData(null);
                        setIllustrations([]);
                        setQuestion(data.text);
                        setExamples(data.examples || []);
                        setShowTextInput(false);
                    } else if (data.type === 'illustration') {
                        setDraftData(null);
                        setQuestion('');
                        setExamples([]);
                        setIllustrations(data.urls || []);
                    } else if (data.type === 'draft') {
                        setQuestion('');
                        setExamples([]);
                        setIllustrations([]);
                        setDraftData(data);
                    }
                };

                socketRef.current.onclose = () => { if (isCancelled) return; setStatus('closed'); };
                socketRef.current.onerror = (error) => { if (isCancelled) return; console.error('웹소켓 에러:', error); };

            } catch (error) {
                if (isCancelled) return;
                console.error(error);
                alert(error.message);
                setStatus('closed');
            }
        };

        setupChat();

        // Cleanup 함수
        return () => {
            isCancelled = true;
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.onerror = null;
                socketRef.current.onmessage = null;
                socketRef.current.onopen = null;
                socketRef.current.close();
            }
        };
    }, [storyId, navigate]);

    // 답변 전송 핸들러
    const handleAnswerSubmit = (text) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ text }));
            setQuestion('');
            setExamples([]);
        }
    };
    
    // 이미지 선택 핸들러
    const handleIllustrationChoice = (choiceIndex) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'scene', text: choiceIndex }));
            setIllustrations([]);
        }
    };

    // draft 리뷰 결과 전송 핸들러
    const handleDraftReview = (decision) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: decision }));
            setDraftData(null); // View 컴포넌트를 닫고 채팅 UI로 돌아감
        }
    };

    const handleDirectInputClick = () => setShowTextInput(true);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            handleAnswerSubmit(inputValue);
            setInputValue('');
            setShowTextInput(false);
        }
    };

    // --- UI 렌더링 로직 ---

    const renderMainContent = () => {
        if (illustrations.length > 0) {
            return (
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
            );
        }
        if (question) {
            return <div className={styles.questionBubble}>{question}</div>;
        }
        return null;
    };

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
        return <div className={styles.statusMessage}>AI와 연결 중입니다...</div>;
    }
    if (status === 'closed') {
        return <div className={styles.statusMessage}>연결이 끊어졌습니다. 페이지를 새로고침 해주세요.</div>;
    }

    // draft 데이터가 있으면 View 컴포넌트를 렌더링
    if (draftData) {
        return <View draft={draftData} onReview={handleDraftReview} />;
    }

    return (
        <div className={styles.chatPage}>
            <div className={styles.contentArea}>
                {renderMainContent()}
            </div>
            <div className={styles.inputArea}>
                {renderInputArea()}
            </div>
        </div>
    );
};

export default Chat;