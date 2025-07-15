import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Room.module.css';

const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const Room = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState('initializing');
    const [roomCode, setRoomCode] = useState('');
    const [topic, setTopic] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [participantCount, setParticipantCount] = useState(0);
    const [showCheckmark, setShowCheckmark] = useState(false);

    const socketRef = useRef(null);
    const viewRef = useRef(view);
    viewRef.current = view;
    const shouldDeleteOnUnmount = useRef(true);

    // ⭐️ 요청하신 `notifications`를 사용하는 알림 함수
    const showNotification = (text, duration = 3000) => {
        const newNotification = { id: Date.now() + Math.random(), text };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, duration);
    };

    const fetchRoomInfo = async (code) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`/api/v1/ws/localshare/rooms/${code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const roomInfo = await response.json();
                setParticipantCount(roomInfo.users.length);
            } else if (viewRef.current === 'guest_waiting') {
                navigate('/');
            }
        } catch (error) {
            console.error("방 정보 갱신 중 에러:", error);
        }
    };

    const connectToSocket = (code) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const wsUrl = `ws://localhost:8000/api/v1/ws/localshare/${code}`;
        socketRef.current = new WebSocket(wsUrl, ['jwt', token]);
        socketRef.current.onopen = () => console.log(`[${code}] 대기방 웹소켓 연결 성공`);
        socketRef.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notice') {
                showNotification(data.text);
                fetchRoomInfo(code);
            } else if (data.type === 'start_game' && data.topic) {
                const title = data.topic;
                const token = localStorage.getItem('access_token');
                try {
                    const response = await fetch('/api/v1/users/me/stories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ title }),
                    });
                    if (!response.ok) throw new Error('스토리 생성에 실패했습니다.');
                    const newStory = await response.json();
                    
                    shouldDeleteOnUnmount.current = false;
                    console.log("새 스토리 생성:", newStory);

                    navigate(`/chat/story/${newStory.id}`);
                } catch (error) {
                    showNotification(error.message);
                }
            }
        };
        socketRef.current.onclose = () => {
            if (viewRef.current === 'guest_waiting' && shouldDeleteOnUnmount.current) {
            showNotification("방장이 방을 나갔습니다. 메인 화면으로 돌아갑니다.");
            navigate('/', { replace: true });
        }
        };
        socketRef.current.onerror = () => {
            showNotification("방에 연결할 수 없거나 존재하지 않는 방입니다.");
            navigate('/', { replace: true });
        };
    };

    const handleCreateRoom = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch('/api/v1/rooms', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('방 생성에 실패했습니다.');
            const data = await response.json();
            setView('hosting');
            setRoomCode(data.room_code);
            setParticipantCount(1);
            setTimeout(() => connectToSocket(data.room_code), 100);
        } catch (error) {
            showNotification(error.message);
            navigate('/', { replace: true });
        }
    };
    
    const handleShowJoinView = () => {
        setRoomCode('');
        setView('joining');
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        const codeToJoin = roomCode.trim();
        if (!codeToJoin) {
            showNotification('코드를 입력해주세요.');
            return;
        }
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`/api/v1/ws/localshare/rooms/${codeToJoin}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("방을 찾을 수 없습니다. 코드를 확인해주세요.");
            const roomInfo = await response.json();
            setView('guest_waiting');
            setRoomCode(codeToJoin);
            setParticipantCount(roomInfo.users.length);
            connectToSocket(codeToJoin);
        } catch (error) {
            showNotification(error.message);
        }
    };
    
    const handleTopicSubmit = (e) => {
        e.preventDefault();
        const title = topic.trim();
        if (!title) {
            showNotification('주제를 적어 주세요!');
            return;
        }
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'start_game', topic: title }));
        }
    };

    const handleCopyCode = () => {
        if (!roomCode) return;
        navigator.clipboard.writeText(roomCode).then(() => {
            setShowCheckmark(true);
            setTimeout(() => setShowCheckmark(false), 2000);
            showNotification('복사되었습니다'); // ⭐️ 요청하신 로직대로 수정
        }).catch(err => {
            showNotification('복사에 실패했습니다.');
        });
    };
    
    useEffect(() => {
        const action = location.state?.action;
        if (action === 'create') {
            handleCreateRoom();
        } else if (action === 'join') {
            handleShowJoinView();
        } else {
            navigate('/', { replace: true });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        return () => {
            if (viewRef.current === 'hosting' && shouldDeleteOnUnmount.current) {
                const token = localStorage.getItem('access_token');
                fetch(`/api/v1/ws/localshare/rooms/${roomCode}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                    keepalive: true,
                });
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [roomCode]);

    const renderWaitingRoom = () => (
        <div className={styles.hostingBox}>
            <div className={styles.codeSection}>
                <label className={styles.label}>코드를 눌러 복사하세요!</label>
                <div className={styles.codeDisplay} onClick={handleCopyCode}>
                    {roomCode}
                    {showCheckmark && <CheckIcon className={styles.copyCheckmark} />}
                </div>
            </div>
            <div className={styles.participantSection}>{participantCount}명 들어옴</div>
            {view === 'hosting' ? (
                <form onSubmit={handleTopicSubmit} className={styles.topicForm}>
                    <input type="text" className={styles.topicInput} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="주제를 입력해주세요!" autoFocus />
                    <button type="submit" className={styles.button}>시작하기!</button>
                </form>
            ) : (
                <div className={styles.waitingMessage}>방장이 시작하기를 기다리고 있습니다...</div>
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.notificationContainer}>
                {notifications.map(notif => (
                    <div key={notif.id} className={styles.notification}>
                        {notif.text}
                    </div>
                ))}
            </div>
            <div className={styles.roomBox}>
                {view === 'initializing' && <div className={styles.waitingMessage}>준비 중...</div>}
                {(view === 'hosting' || view === 'guest_waiting') && renderWaitingRoom()}
                {view === 'joining' && (
                    <div className={styles.joiningBox}>
                        <form onSubmit={handleJoinSubmit} className={styles.joinForm}>
                            <label className={styles.label}>CODE를 입력해주세요!</label>
                            <input type="text" className={styles.codeInput} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="코드를 입력하세요" autoFocus />
                            <button type="submit" className={styles.button}>들어가기</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Room;