import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 토큰과 워크스페이스 ID가 모두 있으면 챗 페이지로!
    if (localStorage.getItem('token') && localStorage.getItem('workspace_id')) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 💡 [핵심 복구 포인트] 스프링이 준 토큰, 유저ID, 팀ID를 모두 금고(localStorage)에 저장합니다!
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('workspace_id', data.workspace_id); 
        
        navigate('/chat'); // 저장 완료 후 채팅방으로 진입!
      } else {
        alert("🚨 로그인 실패: 이메일이나 비밀번호를 확인하세요.");
      }
    } catch (error) {
      alert("❌ 서버와 연결할 수 없습니다.");
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo-text">Dativus</div>
        <div className="top-nav">
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>회원가입</span>
          <button className="btn-top-login">로그인</button>
        </div>
      </header>
      <main className="main-content">
        <div className="login-container">
          <h1 className="login-title">로그인</h1>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-submit-login">로그인</button>
          </form>
        </div>
      </main>
    </>
  );
}