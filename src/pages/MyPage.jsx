import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyPage() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('user_id');

  // 💡 유저 기본 정보 상태 (진짜 내 정보가 들어갈 자리!)
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('로딩 중...');

  // 💡 페르소나 상태 관리
  const [decisionStyle, setDecisionStyle] = useState('일반적인');
  const [expertise, setExpertise] = useState('기본');
  const [tone, setTone] = useState('친절한');

  // 🟢 [신규 무전 로직] 페이지가 열릴 때 DB에서 내 정보 싹 가져오기!
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) {
        alert("비정상적인 접근입니다.");
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8080/api/v1/users/${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          // 가져온 진짜 데이터로 화면 상태 업데이트!
          setEmail(data.email);
          setUsername(data.username);
          setDecisionStyle(data.decisionStyle);
          setExpertise(data.expertise);
          setTone(data.tone);
        }
      } catch (error) {
        console.error("프로필 동기화 실패:", error);
      }
    };

    fetchProfile();
  }, [currentUserId, navigate]);

  // 🟢 서버로 페르소나 변경 요청 쏘기 (저장 기능)
  const handleSavePersona = async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/v1/users/${currentUserId}/persona`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionStyle, expertise, tone })
      });

      if (response.ok) {
        alert("✅ AI 어시스턴트의 성향이 완벽하게 업데이트되었습니다! 채팅방에서 확인해 보십시오.");
      } else {
        alert("🚨 페르소나 업데이트에 실패했습니다.");
      }
    } catch (error) {
      alert("❌ 서버와 연결할 수 없습니다.");
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo-text" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>Dativus</div>
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => { localStorage.clear(); navigate('/'); }}>로그아웃</button>
        </div>
      </header>

      <div className="page-title-container" style={{ textAlign: 'center', padding: '50px 0 70px 0' }}>
        <h1 className="page-title" style={{ fontSize: '38px', letterSpacing: '10px', fontWeight: '700', margin: 0 }}>마이페이지</h1>
      </div>

      <div className="layout-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', width: '100%' }}>
        
        <div className="sidebar-cell" style={{ borderRight: '3px solid #dbdbdb', padding: '20px 20px 60px 40px' }}>
          <div className="sidebar-title active" style={{ color: '#000', fontSize: '20px', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '8px', textDecorationThickness: '2px', cursor: 'pointer' }} onClick={() => navigate('/mypage')}>마이페이지</div>
          <div className="sidebar-title" style={{ color: '#888', fontSize: '18px', fontWeight: '700', marginTop: '40px', cursor: 'pointer' }} onClick={() => navigate('/chat')}>채팅방으로 이동</div>
        </div>

        <div className="content-cell" style={{ padding: '20px 0 60px 100px' }}>
          <div className="profile-section" style={{ display: 'flex', gap: '80px' }}>
            <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div className="profile-img" style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#e3f2fd', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="프로필" style={{ width: '100%' }} />
              </div>
              {/* 💡 정적인 '지휘관' 글자를 지우고 실제 가입한 이름 띄우기! */}
              <span style={{ fontWeight: '700', fontSize: '17px' }}>{username}</span>
            </div>

            <div className="account-info" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px', width: '400px' }}>
              
              <div className="input-row" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <label style={{ fontWeight: '700', width: '70px' }}>E-mail:</label>
                {/* 💡 정적인 이메일을 지우고 실제 가입한 이메일 띄우기! */}
                <input type="email" value={email} readOnly style={{ padding: '10px', border: '1px solid #888', flex: 1, backgroundColor: '#f0f0f0', outline: 'none' }} />
              </div>
              
              <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px', border: '1px solid #eee', marginTop: '10px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>🤖 AI 어시스턴트 성향 설정</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>🧠 판단 스타일</label>
                    <select value={decisionStyle} onChange={(e) => setDecisionStyle(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}>
                      <option value="일반적인">일반적인 (균형)</option>
                      <option value="논리적인">논리적인 (분석적)</option>
                      <option value="직관적인">직관적인 (창의적)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>🛠️ 전문 분야</label>
                    <select value={expertise} onChange={(e) => setExpertise(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}>
                      <option value="기본">기본 (제너럴리스트)</option>
                      <option value="프론트엔드">프론트엔드 (UI/UX)</option>
                      <option value="백엔드">백엔드 (서버/DB)</option>
                      <option value="데이터 엔지니어">데이터 엔지니어 (파이프라인)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#555' }}>🗣️ 대화 어조</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}>
                      <option value="친절한">친절한 (기본)</option>
                      <option value="단호하고 전문적인">전문적인 (딱딱함)</option>
                      <option value="사극 이순신 장군">이순신 장군 (사극 톤)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSavePersona}
                  style={{ width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  성향 동기화 (저장)
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}