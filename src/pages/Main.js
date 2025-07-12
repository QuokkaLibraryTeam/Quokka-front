import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Main.module.css';
import LazyImage from '../components/LazyImage';
import menu1 from '../assets/images/Menu1.png';
import menu2 from '../assets/images/Menu2.png';
import menu3 from '../assets/images/Menu3.png';

// 물음표 아이콘
const QuestionIcon = () => (
    <div className={styles.questionIcon}>?</div>
);

const Main = () => {
  const navigate = useNavigate(); // 페이지 이동을 위한 훅
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  // 컴포넌트가 마운트될 때 인증 상태를 확인합니다.
  useEffect(() => {
    const checkAuthStatus = async () => {
      // 1. 로컬 스토리지에서 토큰을 가져옵니다.
      const token = localStorage.getItem('access_token');

      // 2. 토큰이 없으면 바로 로그인 페이지로 리디렉션합니다.
      if (!token) {
        navigate('/auth', { replace: true });
        return;
      }

      try {
        // 3. 토큰이 있으면 서버에 유효성 검사를 요청합니다.
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });

        // 4. 응답이 성공적이지 않으면(예: 401 Unauthorized) 토큰이 유효하지 않은 것입니다.
        if (!response.ok) {
          throw new Error('인증 실패');
        }
        
        // 5. 인증 성공 시: 아무것도 하지 않고 페이지에 머무릅니다.
        // const userData = await response.json();
        // console.log('인증 성공:', userData);

      } catch (error) {
        // 6. 에러 발생 시(네트워크 문제 또는 인증 실패), 로컬 스토리지의 토큰을 지우고 로그인 페이지로 리디렉션합니다.
        console.error('인증 에러:', error);
        localStorage.removeItem('access_token');
        navigate('/auth', { replace: true });
      }
    };

    checkAuthStatus();
  }, [navigate]); // navigate가 변경될 때만 이펙트를 다시 실행합니다.
// '동화 만들기' 버튼 클릭 시 실행될 핸들러
const handleCreateStoryClick = () => {
  setIsModalOpen(true);
};

// 스토리 생성 및 API 호출 핸들러
const handleStorySubmit = async (e) => {
  e.preventDefault();
  if (!title.trim()) {
    alert('동화 제목을 입력해주세요.');
    return;
  }

  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch('/api/v1/users/me/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title: title }),
    });

    if (!response.ok) {
      throw new Error('스토리 생성에 실패했습니다.');
    }

    const newStory = await response.json();
    // 성공 시, 생성된 스토리의 채팅 페이지로 이동
    navigate(`/chat/story/${newStory.id}`);

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

return (
  <>
    <div className={styles.mainContainer}>
      <div className={styles.gridContainer}>
        {/* ... (다른 카드들은 그대로 둡니다) ... */}
        <div className={styles.card}>
          <div className={styles.imageWrapper}>
              <LazyImage src={menu1} alt="" />
              <QuestionIcon />
          </div>
        </div>
        <div></div>
        <div className={styles.card}>
        <button className={styles.button} onClick={() => navigate('/multiplayer')}>다른 사람이랑 같이 놀자! </button>
        </div>
        
        {/* '동화 만들기' 이미지. 클릭 시 모달을 엽니다. */}
        <div className={styles.card}>
            <div className={styles.imageWrapper} onClick={handleCreateStoryClick}>
                <LazyImage src={menu2} alt="동화 만들기" />
                 <QuestionIcon />
            </div>
        </div>

        <div className={styles.card}>
             <div className={styles.imageWrapper}>
                <LazyImage src={menu3} alt="내가 만든 동화" />
                 <QuestionIcon />
            </div>
        </div>
        <div className={styles.card}>
            <button className={styles.button}>다른 사람 동화 보기</button>
        </div>
      </div>
    </div>

    {/* 모달 UI */}
    {isModalOpen && (
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContent}>
          <h2>새로운 동화 만들기</h2>
          <p>동화의 제목을 지어주세요!</p>
          <form onSubmit={handleStorySubmit}>
            <input
              type="text"
              className={styles.modalInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 용감한 쿼카의 모험"
              autoFocus
            />
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setIsModalOpen(false)} className={styles.modalButton}>취소</button>
              <button type="submit" className={`${styles.modalButton} ${styles.submitButton}`}>시작하기</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
};

export default Main;