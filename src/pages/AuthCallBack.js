import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  // URL의 쿼리 파라미터를 가져오기 위한 훅
  const [searchParams] = useSearchParams();
  // 페이지 이동을 위한 훅
  const navigate = useNavigate();

  useEffect(() => {
    // URL에서 'token'이라는 이름의 파라미터(JWT)를 찾습니다.
    const token = searchParams.get('access_token');
    const nickname = searchParams.get('nickname');

    if (token) {
      // 1. 토큰이 존재하면 로컬 스토리지에 저장합니다.
      localStorage.setItem('access_token', token);
      localStorage.setItem('nickname', nickname);
      // 2. 메인 페이지로 사용자를 이동시킵니다.
      // replace: true 옵션으로 뒤로가기 시 콜백 페이지로 돌아오지 않게 합니다.
      navigate('/', { replace: true });
    } else {
      // 3. 토큰이 없으면 에러 메시지를 보여주고 로그인 페이지로 돌려보냅니다.
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/auth', { replace: true });
    }
    // 이 useEffect는 컴포넌트가 처음 렌더링될 때 한 번만 실행됩니다.
  }, [navigate, searchParams]);

  return (
    // 토큰 처리 중 사용자에게 보여줄 로딩 화면
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>로그인 처리 중입니다...</h2>
    </div>
  );
};

export default AuthCallback;
