import React from 'react';
import { Route, Routes, useLocation, matchPath } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Main from "./pages/Main";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallBack";
import Chat from './components/generator/Chat'; // pages 폴더로 이동했다고 가정
import Room from './components/generator/Room';
import MultiChat from './components/generator/MultiChat';
import MyPage from './components/gallery/MyPage';
import SharePage from './components/gallery/SharePage';
import StoryView from './components/gallery/StoryView';
import ShareView from './components/gallery/ShareView';
import Quiz from './components/generator/Quiz';
import QuizPage from './components/generator/QuizPage';
import QuizView from './components/generator/QuizView';

function App() {
  const location = useLocation();
  
  // 인증 페이지 여부 확인
  const isAuthPage = location.pathname === '/auth';
  
  // 채팅 페이지 여부 확인
  const isChatPage = matchPath("/chat/story/:storyId", location.pathname);

  // isAuthPage와 isChatPage가 모두 아닐 때만 Footer를 보여주도록 수정
  const showFooter = !isAuthPage && !isChatPage;

  return (
    <div className="h-screen bg-[var(--milk)] flex flex-col font-sans">
      {!isAuthPage && <Header type={isChatPage ? 'chat' : 'main'} />}

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />}/>
          <Route path="/chat/story/:storyId" element={<Chat />} />
          <Route path="/multiplayer" element={<Room />} />
          <Route path="/room/:roomCode" element={<MultiChat />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/view/story/:story_id" element={<StoryView />} />
          <Route path="/share" element={<SharePage/>} />
          <Route path="/share/:story_id" element={<ShareView/>} />
          <Route path="/quiz/:storyId" element={<Quiz />} />
          <Route path="/view/quiz/:storyId" element={<QuizView />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Routes>
      </main>
{/* 
      {showFooter && <Footer />} */}
    </div>
  );
}

export default App;