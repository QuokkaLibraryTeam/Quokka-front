import React from 'react';
import styles from './Auth.module.css';

// Google 로고 아이콘 (SVG)
const GoogleIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.712,34.464,44,28.756,44,20C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


const Auth = () => {
    // Google 로그인 버튼 클릭 시 실행될 함수
    const handleGoogleLogin = async () => {
        try {
            // 1. 백엔드에 로그인 요청을 보내 Google 인증 URL을 받습니다.
            const response = await fetch('/api/v1/auth/login');
            if (!response.ok) {
                throw new Error('로그인 URL을 받아오는데 실패했습니다.');
            }
            const data = await response.json();
            
            // 2. 받은 URL로 사용자를 리디렉션하여 Google 인증을 시작합니다.
            window.location.href = data.auth_url;
        } catch (error) {
            console.error("Google 로그인 중 에러 발생:", error);
            alert('로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.contentWrapper}>
                <h1 className={styles.title}>쿼카의 서재</h1>
                <p className={styles.subtitle}>쿼카와 함께 동화를 만들어요.</p>
                <button className={styles.googleButton} onClick={handleGoogleLogin}>
                    <GoogleIcon className={styles.googleIcon} />
                    <span>Google로 로그인</span>
                </button>
            </div>
        </div>
    );
};

export default Auth;
