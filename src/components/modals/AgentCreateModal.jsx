export default function AgentCreateModal({ agentForm, setAgentForm, onCreate, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>🤖 새로운 자아(Ego) 각인</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>요원 이름</label>
          <input
            type="text"
            value={agentForm.name}
            onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>성격 및 역할</label>
          <textarea
            rows={4}
            value={agentForm.description}
            onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>구동 엔진</label>
          <select
            value={agentForm.agentType}
            onChange={(e) => setAgentForm({ ...agentForm, agentType: e.target.value })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            <option value="LOCAL">로컬 LLM</option>
            <option value="EXTERNAL_API">외부 API</option>
          </select>
        </div>

        <button
          onClick={() => onCreate(onClose)}
          style={{ marginTop: '10px', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
        >
          자아 생성 완료
        </button>
      </div>
    </div>
  );
}
