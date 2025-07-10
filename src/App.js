import React from 'react';
import { Route, Routes } from "react-router-dom";

// 컴포넌트 import
import Header from "./components/Header";
import Footer from "./components/Footer"; // Footer는 이제 스스로 모달을 관리합니다.

// 페이지 import
import Main from "./pages/Main";
import Auth from "./pages/Auth";

function App() {
  // App 컴포넌트에서 모달 관련 상태와 함수를 모두 제거했습니다.

  return (
    <div className="h-screen bg-[var(--milk)] flex flex-col font-sans">
      <Header />

      {/* 페이지 콘텐츠가 표시되는 영역입니다. */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      {/* Footer는 이제 prop 없이 스스로 동작합니다. */}
      <Footer />
    </div>
  );
}

export default App;
