// src/components/generator/MultiChat.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './MultiChat.module.css';

const MultiChat = () => {
    const { roomId } = useParams(); // URL에서 room_code를 가져옴
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || !roomId) {
            alert("잘못된 접근입니다.");
            navigate('/');
            return;
        }

        const wsUrl = `ws://localhost:8000/api/v1/ws/localshare/${roomId}`;
        socketRef.current = new WebSocket(wsUrl, ['jwt', token]);

        socketRef.current.onopen = () => {
            console.log("협업 채팅방 웹소켓 연결 성공");
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // TODO: notice, message, story_result 등 다양한 타입의 메시지 처리
            // 지금은 모든 메시지를 화면에 표시
            setMessages(prev => [...prev, data]);
        };

        socketRef.current.onclose = () => console.log("협업 채팅방 웹소켓 연결 종료");
        socketRef.current.onerror = (error) => console.error("협업 채팅방 웹소켓 에러:", error);

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [roomId, navigate]);
    
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() && socketRef.current) {
            // TODO: 서버와 약속된 메시지 형식으로 전송
            socketRef.current.send(JSON.stringify({ type: 'message', text: inputValue }));
            setInputValue('');
        }
    };

    return (
        <div className={styles.container}>
            <h1>다 함께 만들기 ({roomId})</h1>
            <div className={styles.messageList}>
                {messages.map((msg, index) => (
                    <div key={index} className={styles.message}>
                        {/* 메시지 타입에 따라 다르게 렌더링 */}
                        {msg.type === 'notice' ? `[알림] ${msg.text}` : `${msg.sender || '익명'}: ${msg.text}`}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className={styles.inputForm}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="메시지를 입력하세요"
                />
                <button type="submit">전송</button>
            </form>
        </div>
    );
};

export default MultiChat;