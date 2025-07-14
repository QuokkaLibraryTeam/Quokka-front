import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Chat.module.css'; // Chat.js의 스타일을 재사용합니다.

const Quiz = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();

    // --- 상태 관리 ---
    const [status, setStatus] = useState('initializing');
    const [messageHistory, setMessageHistory] = useState([]);
    const [examples, setExamples] = useState([]); // 퀴즈 선택지
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const socketRef = useRef(null);
    const historyEndRef = useRef(null);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000';

    // --- 효과 훅 ---

    // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageHistory]);

    // 웹소켓 설정 및 연결
    useEffect(() => {
        let isCancelled = false;

        const setupQuizSocket = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !storyId) {
                navigate('/login');
                return;
            }

            try {
                // 퀴즈 세션을 위한 세션 키 요청
                const initChatResponse = await fetch(`${BACKEND_URL}/api/v1/stories/${storyId}/chat`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isCancelled) return;
                if (!initChatResponse.ok) throw new Error('퀴즈 세션을 시작하는 데 실패했습니다.');

                const chatSessionData = await initChatResponse.json();
                const sessionKey = chatSessionData.session_key;
                if (!sessionKey) throw new Error('세션 키를 받지 못했습니다.');

                // 웹소켓 연결
                setStatus('connecting');
                const wsUrl = `${WEBSOCKET_URL}/api/v1/ws/story/${sessionKey}`;
                socketRef.current = new WebSocket(wsUrl, ['jwt', token]);

                // 웹소켓 이벤트 핸들러
                socketRef.current.onopen = () => {
                    if (isCancelled) return;
                    setStatus('open');
                    // 퀴즈 시작을 위한 초기 메시지 전송
                    socketRef.current.send(JSON.stringify({ type: 'quiz', text: '' }));
                };

                socketRef.current.onmessage = (event) => {
                    if (isCancelled) return;
                    const data = JSON.parse(event.data);

                    // 서버로부터 받은 질문 및 선택지 처리
                    if (data.type === 'question') {
                        setMessageHistory(prev => [...prev, { sender: 'ai', text: data.text }]);
                        setExamples(data.examples || []);
                        setShowTextInput(false);
                    } else if (data.type === 'feedback') { // *** 수정된 부분: feedback 타입 처리 ***
                        // 피드백 메시지를 AI의 응답으로 처리하여 화면에 표시
                        setMessageHistory(prev => [...prev, { sender: 'ai', text: data.text }]);
                    }
                };

                socketRef.current.onclose = () => { if (!isCancelled) setStatus('closed'); };
                socketRef.current.onerror = (error) => { if (!isCancelled) console.error('웹소켓 에러:', error); setStatus('closed');};

            } catch (error) {
                if (!isCancelled) {
                    console.error("Error setting up quiz socket:", error);
                    alert(error.message);
                    setStatus('closed');
                }
            }
        };

        setupQuizSocket();

        // 컴포넌트 언마운트 시 웹소켓 연결 해제
        return () => {
            isCancelled = true;
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [storyId, navigate, BACKEND_URL, WEBSOCKET_URL]);

    // --- 핸들러 함수 ---
    const handleAnswerSubmit = (text) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            setMessageHistory(prev => [...prev, { sender: 'user', text }]);
            // 사용자 답변을 서버로 전송
            socketRef.current.send(JSON.stringify({ text }));
            setExamples([]);
            setShowTextInput(false);
            setInputValue('');
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
                    {/* 퀴즈에서는 주관식 입력이 필요하다면 아래 버튼의 주석을 해제하세요. */}
                    {/* <button className={`${styles.choiceButton} ${styles.directInputButton}`} onClick={handleDirectInputClick}>내가 쓸게!</button> */}
                </div>
            );
        }
        return null;
    }

    if (status === 'initializing' || status === 'connecting') {
        return (
            <div className={styles.chatPage}>
                <div className={styles.statusMessage}>퀴즈를 준비 중입니다... 🤔</div>
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

    return (
        <div className={styles.chatPage}>
            <div className={styles.chatBookshelf}>
                <div className={styles.messageHistory}>
                    {messageHistory.map((msg, index) => (
                        <div key={index} className={`${styles.bubble} ${msg.sender === 'ai' ? styles.aiBubble : styles.userBubble}`}>
                            {/* 줄바꿈 문자를 <br> 태그로 변환하여 렌더링 */}
                            {msg.text.split('\\n').map((line, i) => <span key={i}>{line}<br/></span>)}
                        </div>
                    ))}
                    <div ref={historyEndRef} />
                </div>
                <div className={styles.inputArea}>
                    {renderInputArea()}
                </div>
            </div>
        </div>
    );
};

export default Quiz;