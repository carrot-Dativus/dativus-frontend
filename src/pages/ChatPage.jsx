import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // 파일 업로드 및 지식망 상태
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDocManagerOpen, setIsDocManagerOpen] = useState(false);
  const [docList, setDocList] = useState([]);

  // 워크스페이스 및 팀 상태
  const currentUserId = localStorage.getItem('user_id') || ""; 
  const workspaceId = localStorage.getItem('workspace_id'); 
  const [sessionId, setSessionId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // 💡 [신규 추가] 자아(에이전트) 관리 상태
  const [agentList, setAgentList] = useState([]);
  const [isAgentCreateOpen, setIsAgentCreateOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', description: '', agentType: 'LOCAL' });

  // 🟢 초기 로드 로직
  useEffect(() => {
    if (!workspaceId || workspaceId === 'null') {
      alert("구형 계정입니다. 새 계정으로 가입하여 샌드박스를 발급받아 주십시오!");
      localStorage.clear();
      navigate('/');
      return;
    }

    const fetchHistory = async () => {
      try {
        const sessionRes = await fetch('http://127.0.0.1:8080/api/v1/chats/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: workspaceId, title: "기본 채팅방" })
        });
        if (!sessionRes.ok) return;
        const sessionData = await sessionRes.json();
        const currentSessionId = sessionData.sessionId;
        setSessionId(currentSessionId);

        const historyRes = await fetch(`http://127.0.0.1:8080/api/v1/chats/session/${currentSessionId}/messages`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setMessages(historyData);
        }
      } catch (error) {
        console.error("채팅 내역 로드 실패:", error);
      }
    };
    
    fetchHistory();
    fetchAgents(); // 💡 초기 로드 시 내 자아 목록도 함께 불러옵니다!
  }, [workspaceId, navigate, currentUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // =========================================================
  // 🟢 [신규 추가] 자아(에이전트) 통신 로직
  // =========================================================

  // 1. 내 자아 목록 불러오기
  const fetchAgents = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/agents/user/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setAgentList(data);
      }
    } catch (error) {
      console.error("자아 목록 로드 실패");
    }
  };

  // 2. 새로운 자아 창조하기 (서버로 전송)
  const handleCreateAgent = async () => {
    if (!agentForm.name.trim() || !agentForm.description.trim()) {
      alert("요원의 이름과 성격(설명)을 모두 입력해 주십시오!");
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8080/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: agentForm.name,
          description: agentForm.description,
          agentType: agentForm.agentType
        })
      });
      if (res.ok) {
        alert("🤖 새로운 자아가 성공적으로 각인되었습니다!");
        setIsAgentCreateOpen(false);
        setAgentForm({ name: '', description: '', agentType: 'LOCAL' });
        fetchAgents(); // 성공 후 목록 즉시 갱신
      } else {
        alert("자아 생성 실패!");
      }
    } catch (error) {
      alert("통신 오류 발생!");
    }
  };

  // =========================================================
  // 🟡 기존 지식망 & 채팅 통신 로직 (유지)
  // =========================================================
  const fetchDocuments = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/documents/workspace/${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setDocList(data);
      }
    } catch (error) {
      console.error("문서 목록 로드 실패");
    }
  };

  useEffect(() => {
    let radarInterval;
    if (isDocManagerOpen) {
      fetchDocuments();
      radarInterval = setInterval(() => { fetchDocuments(); }, 3000);
    }
    return () => { if (radarInterval) clearInterval(radarInterval); };
  }, [isDocManagerOpen, workspaceId]);

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("정말로 이 문서를 AI의 지식망에서 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) { alert("🗑️ 문서가 성공적으로 삭제되었습니다!"); fetchDocuments(); }
    } catch (error) { alert("삭제 통신 오류!"); }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workspaceId', workspaceId); 

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert("🚨 출입증이 없습니다."); setIsUploading(false); return; }
      
      const response = await fetch('http://127.0.0.1:8080/api/v1/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      
      if (response.ok) {
        alert("✅ 파일 접수 완료!");
        setIsUploadOpen(false); setSelectedFile(null); fetchDocuments(); 
      } else {
        const errText = await response.text(); alert(`🚨 백엔드 에러 발생:\n${errText}`);
      }
    } catch (error) {
      alert(`❌ 프론트/네트워크 오류:\n${error.message}`); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) { alert("팀 이름을 입력하세요!"); return; }
    try {
      const res = await fetch('http://127.0.0.1:8080/api/v1/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      const data = await res.json();
      await handleJoinTeam(data.inviteCode);
    } catch (error) { alert("팀 생성 실패!"); }
  };

  const handleJoinTeam = async (codeToJoin) => {
    const code = codeToJoin || inviteCode;
    if (!code.trim()) { alert("초대 코드를 입력하세요!"); return; }
    try {
      const res = await fetch('http://127.0.0.1:8080/api/v1/workspaces/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, inviteCode: code })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('workspace_id', data.workspace_id);
        alert("✅ 팀 배정이 완료되었습니다!");
        window.location.reload(); 
      } else { alert("❌ 유효하지 않은 초대코드입니다."); }
    } catch (error) { alert("팀 합류 실패!"); }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userQuery = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

    try {
      await fetch('http://127.0.0.1:8080/api/v1/chats/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: currentUserId, senderType: "USER", senderName: "지휘관", content: userQuery })
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query: userQuery })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiFullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataText = line.replace('data: ', '');
            if (dataText === '[DONE]') break;
            aiFullText += dataText;
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].text = aiFullText;
              return newMsgs;
            });
          }
        }
      }

      await fetch('http://127.0.0.1:8080/api/v1/chats/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: "", senderType: "LOCAL_AI", senderName: "AI 어시스턴트", content: aiFullText })
      });
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "🚨 서버 통신 오류 발생!" }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 50px', borderBottom: '1px solid #eee' }}>
        <div className="logo-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>Dativus AI</div>
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => navigate('/mypage')} style={{ marginRight: '10px' }}>마이페이지</button>
          <button className="btn-top-login" onClick={() => { localStorage.clear(); navigate('/'); }}>로그아웃</button>
        </div>
      </header>

      <div className="layout-grid" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ===================== 좌측 사이드바 ===================== */}
        <div className="sidebar-cell" style={{ width: '260px', borderRight: '3px solid #dbdbdb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <div className="sidebar-title active" style={{ color: '#000', fontSize: '20px', fontWeight: 'bold' }}>💬 AI 샌드박스</div>
          <button onClick={() => setIsUploadOpen(true)} style={{ padding: '15px', backgroundColor: '#e3f2fd', border: '2px dashed #2196f3', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#1976d2' }}>📂 팀 지식 업로드</button>
          <button onClick={() => setIsDocManagerOpen(true)} style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>📊 팀 지식 관리 보드</button>

          {/* 💡 [신규 추가] 나의 자아(에이전트) 보관소 */}
          <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '5px 0' }} />
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
                  <div key={agent.id} style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{agent.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '5px 0' }} />

          {/* 팀 창설/합류 */}
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
        </div>

        {/* ===================== 중앙 채팅 영역 ===================== */}
        <div className="content-cell" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 80px' }}>
          <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>AI 비서에게 무엇이든 물어보세요!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                  {msg.sender === 'user' ? '지휘관' : 'AI 어시스턴트'}
                </div>
                <div style={{ backgroundColor: msg.sender === 'user' ? '#000' : '#f2f2f2', color: msg.sender === 'user' ? '#fff' : '#000', padding: '12px 18px', borderRadius: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="input-bar" style={{ display: 'flex', backgroundColor: '#f2f2f2', borderRadius: '40px', padding: '12px 20px', gap: '15px', alignItems: 'center' }}>
            <input type="text" className="chat-input" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '16px' }} placeholder="명령을 하달해 주십시오..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
            <button className="btn-send" onClick={handleSendMessage} style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold' }}>↑</button>
          </div>
        </div>
      </div>

      {/* ===================== 모달 창 영역 ===================== */}
      {/* 1. 파일 업로드 모달 */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>지식망 파일 추가</h2>
            <input type="file" accept=".pdf,.txt" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#eee', fontWeight: 'bold' }}>취소</button>
              <button onClick={handleFileUpload} disabled={isUploading} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', backgroundColor: '#000', color: '#fff', fontWeight: 'bold' }}>{isUploading ? '전송 중...' : '서버로 전송'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 지식망 보드 모달 */}
      {isDocManagerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>📊 팀 지식망 현황</h2>
              <button onClick={() => setIsDocManagerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px' }}>문서명</th>
                  <th style={{ padding: '10px' }}>학습 상태</th>
                  <th style={{ padding: '10px' }}>삭제</th>
                </tr>
              </thead>
              <tbody>
                {docList.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>업로드된 지식이 없습니다.</td></tr>
                ) : (
                  docList.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontSize: '14px' }}>{doc.fileName}</td>
                      <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', color: doc.status === 'DONE' ? '#4caf50' : '#ff9800' }}>
                        {doc.status === 'DONE' ? '🟢 학습 완료' : '🟡 처리 중'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: '#ff3b3b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>삭제</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💡 [신규 추가] 3. 자아(에이전트) 생성 모달 */}
      {isAgentCreateOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>🤖 새로운 자아(Ego) 각인</h2>
              <button onClick={() => setIsAgentCreateOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>요원 이름 (예: 깐깐한 코드 리뷰어)</label>
              <input type="text" placeholder="이름을 부여해 주십시오" value={agentForm.name} onChange={(e) => setAgentForm({...agentForm, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>성격 및 역할 (프롬프트)</label>
              <textarea placeholder="너는 10년 차 시니어 백엔드 개발자야. 항상 비판적이고 논리적으로 코드를 분석해." rows={4} value={agentForm.description} onChange={(e) => setAgentForm({...agentForm, description: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>구동 엔진</label>
              <select value={agentForm.agentType} onChange={(e) => setAgentForm({...agentForm, agentType: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="LOCAL">로컬 LLM (보안 등급: 1급)</option>
                <option value="EXTERNAL_API">외부 API (보안 등급: 일반)</option>
              </select>
            </div>

            <button onClick={handleCreateAgent} style={{ marginTop: '10px', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              자아 생성 완료
            </button>
          </div>
        </div>
      )}

    </div>
  );
}