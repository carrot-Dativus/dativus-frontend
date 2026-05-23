const selectRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', width: '180px', fontSize: '13px' };
const saveBtnStyle = { width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };

export default function PersonaCard({
  email, username,
  decisionStyle, setDecisionStyle,
  expertise, setExpertise,
  tone, setTone,
  onSave,
}) {
  return (
    <div style={{ display: 'flex', gap: '80px' }}>

      {/* 프로필 이미지 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f0f4f8', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid #ddd' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="프로필" style={{ width: '100%' }} />
        </div>
        <span style={{ fontWeight: '700', fontSize: '17px' }}>{username} 지휘관</span>
      </div>

      {/* 계정 정보 + 페르소나 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '450px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <label style={{ fontWeight: '700', width: '80px' }}>E-mail:</label>
          <input
            type="email"
            value={email}
            readOnly
            style={{ padding: '10px', border: '1px solid #ccc', flex: 1, backgroundColor: '#f9f9f9', outline: 'none', borderRadius: '4px' }}
          />
        </div>

        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            🤖 AI 어시스턴트 페르소나
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={selectRowStyle}>
              <label>🧠 판단 스타일</label>
              <select value={decisionStyle} onChange={(e) => setDecisionStyle(e.target.value)} style={selectStyle}>
                <option value="일반적인">일반적인 (균형)</option>
                <option value="논리적인">논리적인 (분석적)</option>
                <option value="직관적인">직관적인 (창의적)</option>
              </select>
            </div>
            <div style={selectRowStyle}>
              <label>🛠️ 전문 분야</label>
              <select value={expertise} onChange={(e) => setExpertise(e.target.value)} style={selectStyle}>
                <option value="기본">기본 (제너럴리스트)</option>
                <option value="프론트엔드">프론트엔드 (UI/UX)</option>
                <option value="백엔드">백엔드 (서버/DB)</option>
                <option value="데이터 엔지니어">데이터 엔지니어</option>
              </select>
            </div>
            <div style={selectRowStyle}>
              <label>🗣️ 대화 어조</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} style={selectStyle}>
                <option value="친절한">친절한 (기본)</option>
                <option value="단호하고 전문적인">전문적인 (딱딱함)</option>
                <option value="사극 이순신 장군">이순신 장군 (사극 톤)</option>
              </select>
            </div>
          </div>
          <button onClick={onSave} style={saveBtnStyle}>성향 동기화 (저장)</button>
        </div>
      </div>

    </div>
  );
}
