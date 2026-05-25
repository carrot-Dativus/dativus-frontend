import { useNavigate } from 'react-router-dom';
import { useMyPage } from '../hooks/useMyPage';
import { apiClient } from '../api/axiosInstance';
import dativusLogo from '../assets/Dativus_logo.png';
import PersonaCard from '../components/mypage/PersonaCard';
import QualityDashboard from '../components/mypage/QualityDashboard';

export default function MyPage() {
  const navigate = useNavigate();
  const {
    email, username,
    decisionStyle, setDecisionStyle,
    expertise, setExpertise,
    tone, setTone,
    stats,
    handleSavePersona,
  } = useMyPage();

  return (
    <>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 50px', borderBottom: '1px solid #eee' }}>
        <img src={dativusLogo} alt="Dativus" onClick={() => navigate('/chat')} style={{ height: '30px', objectFit: 'contain', cursor: 'pointer' }} />
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => apiClient.logout()}>로그아웃</button>
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '50px 0 40px 0' }}>
        <h1 style={{ fontSize: '38px', letterSpacing: '10px', fontWeight: '700', margin: 0 }}>마이페이지</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', width: '100%' }}>

        {/* 사이드바 */}
        <div style={{ borderRight: '3px solid #dbdbdb', padding: '20px 20px 60px 40px' }}>
          <div style={{ color: '#000', fontSize: '20px', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '8px', cursor: 'pointer' }}>마이페이지</div>
          <div style={{ color: '#888', fontSize: '18px', fontWeight: '700', marginTop: '40px', cursor: 'pointer' }} onClick={() => navigate('/chat')}>채팅방으로 이동</div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ padding: '20px 100px 60px 100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            <PersonaCard
              email={email}
              username={username}
              decisionStyle={decisionStyle} setDecisionStyle={setDecisionStyle}
              expertise={expertise} setExpertise={setExpertise}
              tone={tone} setTone={setTone}
              onSave={handleSavePersona}
            />
            <QualityDashboard stats={stats} />
          </div>
        </div>

      </div>
    </>
  );
}
