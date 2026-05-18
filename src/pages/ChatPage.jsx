import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 💡 방금 만든 3명의 특수 요원들을 본부로 호출합니다!
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CanvasArea from '../components/CanvasArea';

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); 
  
  const [isCanvasOpen, setIsCanvasOpen] = useState(false); 
  const [canvasData, setCanvasData] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]); 
  const [input, setInput] = useState('');
  
  const chatEndRef = useRef(null);
  const logEndRef = useRef(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDocManagerOpen, setIsDocManagerOpen] = useState(false);
  const [docList, setDocList] = useState([]);

  const currentUserId = localStorage.getItem('user_id') || ""; 
  const workspaceId = localStorage.getItem('workspace_id'); 
  const [sessionId, setSessionId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [workspaces, setWorkspaces] = useState([]);

  const [agentList, setAgentList] = useState([]);
  const [isAgentCreateOpen, setIsAgentCreateOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', description: '', agentType: 'LOCAL' });

  const [currentTab, setCurrentTab] = useState('TEAM');
  const [agentLogs, setAgentLogs] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');


  // =========================================================================
  // 💡 [Area 3] 생성형 UI 도면 해독기 (Parser) - 백틱 충돌 완벽 방어!
  // =========================================================================
  const extractCanvasData = (text) => {
    try {
      // 1. **json:DASHBOARD { ... } ** 형태 (볼드체) 탐지
      const starRegex = /\*\*json:(?:DASHBOARD|CANVAS)(.*?)\*\*/s;
      const starMatch = text.match(starRegex);
      if (starMatch && starMatch[1]) {
        return JSON.parse(starMatch[1]);
      }

      // 2. 백틱 3개 형태 탐지 (제미나이 렉 방지 우회식)
      const marker = String.fromCharCode(96, 96, 96);
      const pattern = marker + "json:(?:DASHBOARD|CANVAS)[\\s\\S]*?({[\\s\\S]*?})[\\s\\S]*?" + marker;
      const regex = new RegExp(pattern);
      const match = text.match(regex);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      
    } catch (e) {
      console.error("캔버스 도면 해독 실패:", e);
    }
    return null;
  };


  // =========================================================================
  // 🟢 생명주기 (useEffect) 및 통신 로직 모음
  // =========================================================================
  useEffect(() => {
    if (!workspaceId || workspaceId === 'null') {
      alert("구형 계정입니다. 새 계정으로 가입하여 샌드박스를 발급받아 주십시오!");
      localStorage.clear();
      navigate('/');
      return;
    }

    const initSession = async () => {
      try {
        const sessionRes = await fetch('http://127.0.0.1:8080/api/v1/chats/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: workspaceId, title: "기본 채팅방" })
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessionId(sessionData.sessionId);
        }
      } catch (error) { console.error("세션 초기화 실패:", error); }
    };
    initSession();
    fetchAgents();
  }, [workspaceId, navigate, currentUserId]);

  useEffect(() => {
    if (sessionId) {
      fetch(`http://127.0.0.1:8080/api/v1/chats/session/${sessionId}/messages?isPrivate=false`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setMessages(data))
        .catch(err => console.error(err));
      
      fetch(`http://127.0.0.1:8080/api/v1/chats/session/${sessionId}/messages?isPrivate=true&userId=${currentUserId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setPrivateMessages(data))
        .catch(err => console.error(err));
    }
  }, [sessionId, currentUserId]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!currentUserId) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/v1/workspaces/user/${currentUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        }
      } catch (error) { console.error("방 목록 통신 실패:", error); }
    };
    fetchWorkspaces();
  }, [currentUserId]);

  useEffect(() => {
    if (currentTab === 'TEAM' || currentTab === 'PRIVATE') {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else if (currentTab === 'LOG') {
      logEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, privateMessages, agentLogs, currentTab]);


  // =========================================================================
  // 🟡 각종 핸들러 (버튼 클릭 동작들)
  // =========================================================================
  const fetchAgents = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/agents/user/${currentUserId}`);
      if (res.ok) { setAgentList(await res.json()); }
    } catch (error) { console.error("자아 목록 로드 실패"); }
  };

  const handleCreateAgent = async () => {
    if (!agentForm.name.trim() || !agentForm.description.trim()) {
      alert("요원의 이름과 성격을 모두 입력해 주십시오!"); return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8080/api/v1/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, name: agentForm.name, description: agentForm.description, agentType: agentForm.agentType })
      });
      if (res.ok) {
        alert("🤖 새로운 자아가 각인되었습니다!");
        setIsAgentCreateOpen(false); setAgentForm({ name: '', description: '', agentType: 'LOCAL' });
        fetchAgents(); 
      } else { alert("자아 생성 실패!"); }
    } catch (error) { alert("통신 오류 발생!"); }
  };

  const fetchDocuments = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/documents/workspace/${workspaceId}`);
      if (res.ok) { setDocList(await res.json()); }
    } catch (error) { console.error("문서 목록 로드 실패"); }
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
    if (!window.confirm("정말로 이 문서를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/v1/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) { alert("🗑️ 삭제되었습니다!"); fetchDocuments(); }
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
      if (!token) { alert("출입증이 없습니다."); setIsUploading(false); return; }
      const response = await fetch('http://127.0.0.1:8080/api/v1/documents/upload', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData
      });
      if (response.ok) {
        alert("✅ 파일 접수 완료!");
        setIsUploadOpen(false); setSelectedFile(null); fetchDocuments(); 
      } else { alert("🚨 업로드 실패"); }
    } catch (error) { alert(`❌ 오류: ${error.message}`); } finally { setIsUploading(false); }
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
        alert("✅ 팀 배정 완료!");
        window.location.reload(); 
      } else { alert("❌ 유효하지 않은 코드입니다."); }
    } catch (error) { alert("팀 합류 실패!"); }
  };

  const handleFeedback = async (isPositive, query, answer) => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspaceId, userId: currentUserId, query: query, answer: answer, isPositive: isPositive })
      });
      if (response.ok) { alert(isPositive ? "👍 피드백 감사합니다!" : "👎 뼈아픈 지적 감사합니다."); }
    } catch (error) { console.error("피드백 전송 실패:", error); }
  };

  const handleShareToTeam = async (content) => {
    try {
      await fetch('http://127.0.0.1:8080/api/v1/chats/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: currentUserId, senderType: "LOCAL_AI", senderName: "AI 공유 브리핑", content: content, isPrivate: false })
      });
      setMessages(prev => [...prev, { sender: 'ai', text: `[팀원 공유 메모]\n${content}` }]);
      setCurrentTab('TEAM');
      alert("📢 팀에 공유되었습니다!");
    } catch (error) { alert("공유 실패!"); }
  };


  // =========================================================================
  // 🔵 [핵심] 메시지 전송 및 AI 스트리밍 로직
  // =========================================================================
  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userQuery = input;
    setInput('');

    const isPrivateMode = currentTab === 'PRIVATE';
    const targetSetMessages = isPrivateMode ? setPrivateMessages : setMessages;
    const currentMessageArray = isPrivateMode ? privateMessages : messages;

    targetSetMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    targetSetMessages(prev => [...prev, { sender: 'ai', text: '' }]); 

    const chatHistory = currentMessageArray.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'ai',
      content: msg.text || msg.content 
    }));

    try {
      await fetch('http://127.0.0.1:8080/api/v1/chats/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: currentUserId, senderType: "USER", senderName: "지휘관", content: userQuery, isPrivate: isPrivateMode })
      });

      let targetAgentName = null;
      let targetAgentPrompt = null;
      if (selectedAgentId) {
        const agent = agentList.find(a => a.id === selectedAgentId);
        if (agent) { targetAgentName = agent.name; targetAgentPrompt = agent.description; }
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query: userQuery, workspace_id: workspaceId, history: chatHistory, target_agent_name: targetAgentName, target_agent_prompt: targetAgentPrompt })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiFullText = "";
      let finalLatency = 0.0;
      let finalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataText = line.replace('data: ', '');
            if (dataText === '[DONE]') break;

            if (dataText.startsWith('[LOG]')) {
              const logMsg = dataText.replace('[LOG]', '');
              setAgentLogs(prev => [...prev, logMsg]); 

              if (logMsg.includes('작전 소요 시간:')) {
                const latencyMatch = logMsg.match(/소요 시간: ([\d.]+)초/);
                const tokensMatch = logMsg.match(/소모 토큰: (\d+) Tokens/);
                if (latencyMatch) finalLatency = parseFloat(latencyMatch[1]);
                if (tokensMatch) finalTokens = parseInt(tokensMatch[1]);
              }
            } else {
              aiFullText += dataText;
              targetSetMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = aiFullText;
                return newMsgs;
              });
            }
          }
        }
      }

      // 💡 [Area 3] AI 응답 스트리밍이 끝나면 자동 해독 및 캔버스 스르륵 열기!
      const parsedData = extractCanvasData(aiFullText);
      if (parsedData) {
        setCanvasData(parsedData);
        setIsCanvasOpen(true);
      }

      await fetch('http://127.0.0.1:8080/api/v1/chats/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: "", senderType: "LOCAL_AI", senderName: "AI 어시스턴트", content: aiFullText, isPrivate: isPrivateMode , latency: finalLatency, tokens: finalTokens })
      });
    } catch (error) {
      targetSetMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = "🚨 서버 통신 오류 발생!";
        return newMsgs;
      });
    }
  };


  // =========================================================================
  // 📺 화면 렌더링 (퍼즐 조립)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      
      {/* --- 공통 헤더 --- */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 50px', borderBottom: '1px solid #eee' }}>
        <div className="logo-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>Dativus AI</div>
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => navigate('/mypage')} style={{ marginRight: '10px' }}>마이페이지</button>
          <button className="btn-top-login" onClick={() => { localStorage.clear(); navigate('/'); }}>로그아웃</button>
        </div>
      </header>

      {/* --- 메인 레이아웃 (세 요원 조립) --- */}
      <div className="layout-grid" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 1번 요원: 사이드바 */}
        <Sidebar 
          setIsUploadOpen={setIsUploadOpen} setIsDocManagerOpen={setIsDocManagerOpen} setIsAgentCreateOpen={setIsAgentCreateOpen}
          agentList={agentList} newTeamName={newTeamName} setNewTeamName={setNewTeamName} handleCreateTeam={handleCreateTeam}
          inviteCode={inviteCode} setInviteCode={setInviteCode} handleJoinTeam={handleJoinTeam} workspaces={workspaces} workspaceId={workspaceId}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* 2번 요원: 채팅 영역 */}
          <ChatArea 
            currentTab={currentTab} setCurrentTab={setCurrentTab}
            isCanvasOpen={isCanvasOpen} setIsCanvasOpen={setIsCanvasOpen} setCanvasData={setCanvasData}
            privateMessages={privateMessages} messages={messages} agentLogs={agentLogs}
            chatEndRef={chatEndRef} logEndRef={logEndRef}
            handleShareToTeam={handleShareToTeam} handleFeedback={handleFeedback}
            selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} agentList={agentList}
            input={input} setInput={setInput} handleSendMessage={handleSendMessage}
          />

          {/* 3번 요원: 캔버스 영역 */}
          <CanvasArea 
            isCanvasOpen={isCanvasOpen} setIsCanvasOpen={setIsCanvasOpen} canvasData={canvasData}
          />
        </div>
      </div>

      {/* ===================== 모달 창 영역 (기존 유지) ===================== */}
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
                  <th style={{ padding: '10px' }}>문서명</th><th style={{ padding: '10px' }}>학습 상태</th><th style={{ padding: '10px' }}>삭제</th>
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

      {isAgentCreateOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>🤖 새로운 자아(Ego) 각인</h2>
              <button onClick={() => setIsAgentCreateOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>요원 이름</label>
              <input type="text" value={agentForm.name} onChange={(e) => setAgentForm({...agentForm, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>성격 및 역할</label>
              <textarea rows={4} value={agentForm.description} onChange={(e) => setAgentForm({...agentForm, description: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>구동 엔진</label>
              <select value={agentForm.agentType} onChange={(e) => setAgentForm({...agentForm, agentType: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="LOCAL">로컬 LLM</option>
                <option value="EXTERNAL_API">외부 API</option>
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