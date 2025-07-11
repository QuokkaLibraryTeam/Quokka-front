import React from 'react';
// useLocation 훅을 import 합니다.
import { Route, Routes, useLocation } from "react-router-dom";

// 컴포넌트 import
import Header from "./components/Header";
import Footer from "./components/Footer";

// 페이지 import
import Main from "./pages/Main";
import Auth from "./pages/Auth";

function App() {
  // 현재 경로 정보를 가져옵니다.
  const location = useLocation();
  
  // 현재 경로가 '/auth'인지 확인합니다.
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="h-screen bg-[var(--milk)] flex flex-col font-sans">
      {/* isAuthPage가 false일 때만 Header를 렌더링합니다. */}
      {!isAuthPage && <Header />}

      {/* 페이지 콘텐츠가 표시되는 영역입니다. */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      {/* isAuthPage가 false일 때만 Footer를 렌더링합니다. */}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;
