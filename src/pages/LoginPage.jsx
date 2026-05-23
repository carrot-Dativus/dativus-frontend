import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/axiosInstance';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token') && localStorage.getItem('workspace_id')) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ 하드코딩 + 작은따옴표 버그 → apiClient.post
      const response = await apiClient.post('/api/v1/auth/login', { email, password });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('workspace_id', data.workspace_id);
        navigate('/chat');
      } else {
        alert('🚨 로그인 실패: 이메일이나 비밀번호를 확인하세요.');
      }
    } catch (error) {
      alert('❌ 서버와 연결할 수 없습니다.');
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
