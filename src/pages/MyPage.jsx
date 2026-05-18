import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 💡 [신규] Recharts 차트 도구 임포트
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MyPage() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('user_id');

  // 💡 기본 정보 및 페르소나 상태
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('로딩 중...');
  const [decisionStyle, setDecisionStyle] = useState('일반적인');
  const [expertise, setExpertise] = useState('기본');
  const [tone, setTone] = useState('친절한');

  // 📊 AI 품질 리포트 상태
  const [stats, setStats] = useState({
    totalInteractions: 0,
    csatScore: 0,
    failureLogs: []
  });

  // 🟢 데이터 동기화 로직
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) {
        alert("비정상적인 접근입니다.");
        navigate('/');
        return;
      }

      try {
        const profileRes = await fetch(`http://127.0.0.1:8080/api/v1/users/${currentUserId}`);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setEmail(data.email);
          setUsername(data.username);
          setDecisionStyle(data.decisionStyle);
          setExpertise(data.expertise);
          setTone(data.tone);
        }

        const statsRes = await fetch(`http://127.0.0.1:8080/api/v1/feedback/stats/${currentUserId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("데이터 동기화 실패:", error);
      }
    };

    fetchData();
  }, [currentUserId, navigate]);

  // 🟢 페르소나 저장 로직
  const handleSavePersona = async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/v1/users/${currentUserId}/persona`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionStyle, expertise, tone })
      });

      if (response.ok) alert("✅ AI 어시스턴트의 성향이 완벽하게 업데이트되었습니다!");
    } catch (error) {
      alert("❌ 서버와 연결할 수 없습니다.");
    }
  };

  // 📈 [신규] 차트용 시연 데이터 (추후 백엔드 연동 전까지 시각적 효과 담당)
  const lineData = [
    { name: '5/10', score: 65 },
    { name: '5/11', score: 72 },
    { name: '5/12', score: 85 },
    { name: '5/13', score: 78 },
    { name: '5/14', score: 90 },
    { name: '오늘', score: stats.csatScore }, // 마지막 데이터는 실제 DB 점수 연동!
  ];

  const pieData = [
    { name: 'Dati (기본 커맨더)', value: 55 },
    { name: 'Groq (외부 탐색)', value: 30 },
    { name: 'Egos (특수 요원)', value: 15 },
  ];
  const COLORS = ['#000000', '#4caf50', '#9c27b0']; // 검정, 녹색, 보라

  return (
    <>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 50px', borderBottom: '1px solid #eee' }}>
        <div className="logo-text" onClick={() => navigate('/chat')} style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>Dativus</div>
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => { localStorage.clear(); navigate('/'); }}>로그아웃</button>
        </div>
      </header>

      <div className="page-title-container" style={{ textAlign: 'center', padding: '50px 0 40px 0' }}>
        <h1 className="page-title" style={{ fontSize: '38px', letterSpacing: '10px', fontWeight: '700', margin: 0 }}>마이페이지</h1>
      </div>

      <div className="layout-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', width: '100%' }}>
        
        {/* --- 좌측 사이드바 --- */}
        <div className="sidebar-cell" style={{ borderRight: '3px solid #dbdbdb', padding: '20px 20px 60px 40px' }}>
          <div className="sidebar-title active" style={{ color: '#000', fontSize: '20px', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '8px', cursor: 'pointer' }}>마이페이지</div>
          <div className="sidebar-title" style={{ color: '#888', fontSize: '18px', fontWeight: '700', marginTop: '40px', cursor: 'pointer' }} onClick={() => navigate('/chat')}>채팅방으로 이동</div>
        </div>

        {/* --- 메인 콘텐츠 영역 --- */}
        <div className="content-cell" style={{ padding: '20px 100px 60px 100px' }}>
          
          <div className="profile-section" style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            
            {/* 1. 상단: 유저 정보 및 AI 성향 설정 */}
            <div style={{ display: 'flex', gap: '80px' }}>
              <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div className="profile-img" style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f0f4f8', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid #ddd' }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="프로필" style={{ width: '100%' }} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '17px' }}>{username} 지휘관</span>
              </div>

              <div className="account-info" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '450px' }}>
                <div className="input-row" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <label style={{ fontWeight: '700', width: '80px' }}>E-mail:</label>
                  <input type="email" value={email} readOnly style={{ padding: '10px', border: '1px solid #ccc', flex: 1, backgroundColor: '#f9f9f9', outline: 'none', borderRadius: '4px' }} />
                </div>
                
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>🤖 AI 어시스턴트 페르소나</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={selectRowStyle}><label>🧠 판단 스타일</label>
                      <select value={decisionStyle} onChange={(e) => setDecisionStyle(e.target.value)} style={selectStyle}>
                        <option value="일반적인">일반적인 (균형)</option><option value="논리적인">논리적인 (분석적)</option><option value="직관적인">직관적인 (창의적)</option>
                      </select>
                    </div>
                    <div style={selectRowStyle}><label>🛠️ 전문 분야</label>
                      <select value={expertise} onChange={(e) => setExpertise(e.target.value)} style={selectStyle}>
                        <option value="기본">기본 (제너럴리스트)</option><option value="프론트엔드">프론트엔드 (UI/UX)</option><option value="백엔드">백엔드 (서버/DB)</option><option value="데이터 엔지니어">데이터 엔지니어</option>
                      </select>
                    </div>
                    <div style={selectRowStyle}><label>🗣️ 대화 어조</label>
                      <select value={tone} onChange={(e) => setTone(e.target.value)} style={selectStyle}>
                        <option value="친절한">친절한 (기본)</option><option value="단호하고 전문적인">전문적인 (딱딱함)</option><option value="사극 이순신 장군">이순신 장군 (사극 톤)</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleSavePersona} style={saveBtnStyle}>성향 동기화 (저장)</button>
                </div>
              </div>
            </div>

            {/* 2. 하단: AI 품질 관리 대시보드 */}
            <div style={{ marginTop: '20px', borderTop: '3px solid #000', paddingTop: '40px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '30px', letterSpacing: '2px' }}>📈 AI 품질 관리 실시간 리포트</h2>
              
              {/* --- Level 1: 핵심 KPI 카드 --- */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>AI 응답 만족도 (CSAT)</div>
                  <div style={{ ...statValueStyle, color: stats.csatScore >= 70 ? '#4caf50' : '#ff9800' }}>{stats.csatScore}%</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>총 대화 상호작용</div>
                  <div style={statValueStyle}>{stats.totalInteractions}회</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>오답 자산화 수</div>
                  <div style={{ ...statValueStyle, color: '#f44336' }}>{stats.failureLogs.length}건</div>
                </div>
              </div>

              {/* --- 💡 [신규] Level 2: Recharts 데이터 시각화 --- */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                
                {/* 1) 선 그래프 (만족도 추이) */}
                <div style={chartBoxStyle}>
                  <h4 style={chartTitleStyle}>📈 최근 만족도 변화 추이 (Quality Drift)</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="score" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6, fill: '#4caf50' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '10px', textAlign: 'center' }}>* 프롬프트 개선 후 품질이 지속적으로 우상향하고 있습니다.</p>
                </div>

                {/* 2) 파이 차트 (에이전트 점유율) */}
                <div style={chartBoxStyle}>
                  <h4 style={chartTitleStyle}>🤖 에이전트별 작전 수행 비율</h4>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '13px', marginTop: '10px' }}>
                     {pieData.map((d, i) => <span key={i}><span style={{color: COLORS[i], fontWeight: 'bold'}}>●</span> {d.name}</span>)}
                  </div>
                </div>
              </div>

              {/* --- Level 3: 오답 노트 테이블 --- */}
              <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #dbdbdb' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f44336', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🚨 집중 개선 필요 항목 (오답 노트)
                </h3>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>* 사용자가 👎(싫어요)를 선택한 로그입니다. 프롬프트 개선의 핵심 자산으로 활용됩니다.</p>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '15px', fontSize: '14px' }}>사용자 질문 (Query)</th>
                      <th style={{ padding: '15px', fontSize: '14px' }}>AI의 답변 (Failure Answer)</th>
                      <th style={{ padding: '15px', fontSize: '14px', width: '120px' }}>기록 일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.failureLogs.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '15px' }}>현재까지 수집된 오답 데이터가 없습니다. 완벽한 지휘입니다! 😊</td></tr>
                    ) : (
                      stats.failureLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px', fontSize: '13px', fontWeight: '500' }}>{log.query}</td>
                          <td style={{ padding: '15px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{log.answer}</td>
                          <td style={{ padding: '15px', fontSize: '11px', color: '#aaa' }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// --- 인라인 스타일 정의 ---
const selectRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', width: '180px', fontSize: '13px' };
const saveBtnStyle = { width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };

const statCardStyle = { flex: 1, backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const statLabelStyle = { fontSize: '13px', color: '#888', marginBottom: '15px', fontWeight: 'bold' };
const statValueStyle = { fontSize: '32px', fontWeight: '900', color: '#000' };

// 💡 신규 차트 박스 스타일
const chartBoxStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const chartTitleStyle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' };