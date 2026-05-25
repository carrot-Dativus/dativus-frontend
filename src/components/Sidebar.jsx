export default function Sidebar({
  setIsUploadOpen, setIsDocManagerOpen, setIsAgentCreateOpen,
  agentList, editingAgent, setEditingAgent, handleUpdateAgent, handleDeleteAgent,
  newTeamName, setNewTeamName, handleCreateTeam,
  inviteCode, setInviteCode, handleJoinTeam, workspaces, workspaceId
}) {
  return (
    <div className="sidebar-cell" style={{ width: '260px', flexShrink: 0, borderRight: '3px solid #dbdbdb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      
      {/* --- 상단 메뉴 --- */}
      <div className="sidebar-title active" style={{ color: '#000', fontSize: '20px', fontWeight: 'bold' }}>💬 AI 샌드박스</div>
      <button onClick={() => setIsUploadOpen(true)} style={{ padding: '15px', backgroundColor: '#e3f2fd', border: '2px dashed #2196f3', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#1976d2' }}>📂 팀 지식 업로드</button>
      <button onClick={() => setIsDocManagerOpen(true)} style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>📊 팀 지식 관리 보드</button>

      <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '5px 0' }} />
      
      {/* --- 에이전트 관리 --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>🧠 에이전트 (Egos)</div>
          <button onClick={() => setIsAgentCreateOpen(true)} style={{ padding: '4px 8px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ 추가</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {agentList.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '10px 0' }}>등록된 자아가 없습니다.</div>
          ) : (
            agentList.map(agent => (
              <div key={agent.id} style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                {editingAgent?.id === agent.id ? (
                  // 인라인 수정 폼
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      value={editingAgent.name}
                      onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #aaa', fontSize: '12px' }}
                    />
                    <textarea
                      rows={3}
                      value={editingAgent.description}
                      onChange={e => setEditingAgent({ ...editingAgent, description: e.target.value })}
                      style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #aaa', fontSize: '11px', resize: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleUpdateAgent()} style={{ flex: 1, padding: '4px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>저장</button>
                      <button onClick={() => setEditingAgent(null)} style={{ flex: 1, padding: '4px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  // 일반 표시
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{agent.name}</div>
                      <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '6px', flexShrink: 0 }}>
                      <button onClick={() => setEditingAgent({ id: agent.id, name: agent.name, description: agent.description, agentType: agent.agentType })}
                        style={{ background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '2px 5px' }}>✏️</button>
                      <button onClick={() => handleDeleteAgent(agent.id)}
                        style={{ background: 'none', border: '1px solid #ffcccc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '2px 5px' }}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '5px 0' }} />

      {/* --- 워크스페이스(팀) 관리 --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🚀 새 팀 창설</div>
        <input type="text" placeholder="멋진 팀 이름" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px' }} />
        <button onClick={handleCreateTeam} style={{ padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>만들고 합류하기</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#666' }}>🤝 초대 코드로 합류</div>
        <input type="text" placeholder="6자리 코드" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px' }} />
        <button onClick={() => handleJoinTeam()} style={{ padding: '10px', backgroundColor: '#fff', color: '#000', border: '2px solid #000', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>입장하기</button>
      </div>

      <div className="sidebar-workspaces">
        <h3 style={{ color: '#000', fontSize: '15px', marginTop: '10px', marginBottom: '10px' }}>🌐 나의 소속 팀</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {workspaces.map((ws) => (
            <li 
              key={ws.id}
              style={{
                padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: workspaceId === ws.id ? '#e0f7fa' : 'transparent',
                border: workspaceId === ws.id ? '1px solid #00bcd4' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                localStorage.setItem('workspace_id', ws.id);
                window.location.reload(); 
              }}
            >
              <div style={{ fontWeight: 'bold' }}>🛡️ {ws.name}</div>
              <div style={{ fontSize: '11px', color: 'gray', marginTop: '4px' }}>초대 코드: {ws.inviteCode}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}