import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type {User} from 'firebase/auth';
import { auth } from './firebase';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Schedule from './pages/Schedule';
import { signOut } from 'firebase/auth';
import Attendance from './pages/Attendance';
import Users from './pages/Users';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // 관리자 여부 상태 추가

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 1. 유저가 로그인되면 토큰에서 role을 확인
        const tokenResult = await currentUser.getIdTokenResult(true);
        
        if (tokenResult.claims.role === 'admin') {
          setUser(currentUser);
          setIsAdmin(true);
        } else {
          // 2. 관리자가 아니면 즉시 로그아웃 및 상태 초기화
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
          alert("관리자 권한이 없습니다.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false); // 권한 체크까지 모두 끝나야 로딩 해제
    });

    return () => unsubscribe();
}, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>권한 확인 중...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지: 이미 로그인된 관리자라면 홈으로 보냄 */}
        <Route path="/login" element={user && isAdmin ? <Navigate to="/" /> : <Login />} />

        {/* 보호된 라우트: user와 isAdmin 둘 다 true여야만 진입 가능 */}
        <Route path="/" element={user && isAdmin ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="attendance" element={<Attendance/>} />
          <Route path="users" element={<Users />} />
          {/* 다른 페이지들... */}
            <Route path="notices" element={<div>공지사항 관리 화면 (준비중)</div>} />
            
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;