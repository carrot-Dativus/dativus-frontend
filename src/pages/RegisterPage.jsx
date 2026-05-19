import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== passwordCheck) {
      alert("🚨 비밀번호와 비밀번호 확인이 다릅니다!");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8080/api/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
      });
      if (response.ok) {
        alert("✅ 회원가입 성공! 로그인해 주세요.");
        navigate('/'); // 가입 성공 시 다시 로그인 화면으로 이동
      } else {
        alert("🚨 회원가입 실패");
      }
    } catch (error) {
      alert("❌ 서버 연결 실패");
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo-text">Dativus</div>
        <div className="top-nav">
          <span style={{ cursor: 'pointer', fontWeight: 'bold' }}>회원가입</span>
          <button className="btn-top-login" onClick={() => navigate('/')}>로그인</button>
        </div>
      </header>
      <main className="main-content">
        <div className="register-container">
          <h1 className="register-title">Dativus 회원가입</h1>
          <form onSubmit={handleRegister}>
            <div className="input-group"><label>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="input-group"><label>PASSWORD</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <div className="input-group"><label>PASSWORD-CHECK</label><input type="password" value={passwordCheck} onChange={(e) => setPasswordCheck(e.target.value)} required /></div>
            <div className="input-group"><label>NAME</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
            <button type="submit" className="btn-submit-register">가입하기</button>
          </form>
        </div>
      </main>
    </>
  );
}