export default function ChatArea({
  currentTab, setCurrentTab,
  isCanvasOpen, setIsCanvasOpen, setCanvasData,
  privateMessages, messages, agentLogs,
  chatEndRef, logEndRef,
  handleShareToTeam, handleFeedback,
  selectedAgentId, setSelectedAgentId, agentList,
  input, setInput, handleSendMessage
}) {
  
  // 💡 [지우개 함수] 말풍선 안에서 암호문(JSON)을 깔끔하게 지워주는 역할
  const cleanMessageText = (text) => {
    if (!text) return "";
    let cleaned = text;
    
    // 1. 별표로 감싸진 암호 지우기
    const starRegex = /\*\*json:(?:DASHBOARD|CANVAS)(.*?)\*\*/s;
    cleaned = cleaned.replace(starRegex, '').trim();

    // 2. 백틱으로 감싸진 암호 지우기
    const marker = String.fromCharCode(96, 96, 96);
    const pattern = marker + "json:(?:DASHBOARD|CANVAS)[\\s\\S]*?({[\\s\\S]*?})[\\s\\S]*?" + marker;
    const regex = new RegExp(pattern);
    cleaned = cleaned.replace(regex, '').trim();

    return cleaned;
  };

  return (
    <div className="content-cell" style={{ 
      width: isCanvasOpen ? '50%' : '100%', 
      transition: 'width 0.5s ease-in-out',
      display: 'flex', flexDirection: 'column', padding: '0',
      borderRight: isCanvasOpen ? '2px solid #eee' : 'none'
    }}>
      
      {/* --- 상단 노션 탭 메뉴 --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#888' }}>
          <span style={{ cursor: 'pointer', color: currentTab === 'PRIVATE' ? '#000' : '#888', transition: '0.2s' }} onClick={() => setCurrentTab('PRIVATE')}>👤 개인 공간</span>
          <span style={{ margin: '0 10px', color: '#ccc' }}>/</span>
          <span style={{ cursor: 'pointer', color: currentTab === 'TEAM' ? '#000' : '#888', transition: '0.2s' }} onClick={() => setCurrentTab('TEAM')}>👥 팀 워크스페이스</span>
          <span style={{ margin: '0 10px', color: '#ccc' }}>/</span>
          <span style={{ cursor: 'pointer', color: currentTab === 'LOG' ? '#000' : '#888', transition: '0.2s' }} onClick={() => setCurrentTab('LOG')}>🤖 에이전트 로그</span>
        </div>

        {/* 💡 테스트 버튼 */}
        <button 
          onClick={() => {
            if(!isCanvasOpen) {
              setCanvasData({
                title: "프론트엔드 기술 비교",
                description: "제안된 상태 관리 기술입니다.",
                items: [
                  { option: "A안", name: "Redux", pros: "안정적", cons: "무거움" },
                  { option: "B안", name: "Zustand", pros: "간결함", cons: "관리에 주의" }
                ]
              });
            }
            setIsCanvasOpen(!isCanvasOpen);
          }} 
          style={{ 
            padding: '6px 12px', 
            backgroundColor: isCanvasOpen ? '#333' : '#2196f3', 
            color: '#fff', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
            transition: 'background-color 0.3s'
          }}
        >
          {isCanvasOpen ? '캔버스 닫기' : '🎨 캔버스 열기 (테스트)'}
        </button>
      </div>

      {/* --- 탭에 따라 바뀌는 메인 화면 영역 --- */}
      <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* 👤 개인 공간 탭 */}
        <div style={{ display: currentTab === 'PRIVATE' ? 'flex' : 'none', flexDirection: 'column', gap: '15px' }}>
            {privateMessages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2 style={{ color: '#555' }}>비밀 메모장에 오신 것을 환영합니다.</h2>
                <p style={{ color: '#888', marginTop: '10px' }}>이곳의 대화는 다른 팀원들에게 노출되지 않습니다.</p>
              </div>
            )}
            {privateMessages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                  {msg.sender === 'user' ? '지휘관 (비밀)' : 'AI 어시스턴트 (비밀)'}
                </div>
                <div style={{ 
                  backgroundColor: msg.sender === 'user' ? '#000' : '#fff', 
                  color: msg.sender === 'user' ? '#fff' : '#000', 
                  padding: '12px 18px', borderRadius: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                  border: msg.sender === 'user' ? 'none' : '2px dashed #9c27b0'
                }}>
                  {cleanMessageText(msg.text)}
                </div>
                
                {msg.sender === 'ai' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <button 
                      onClick={() => handleShareToTeam(msg.text)}
                      style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e1bee7', color: '#4a148c', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
                    >
                      📢 팀 워크스페이스로 대화 공유
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleFeedback(true, privateMessages[idx - 1]?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #4CAF50', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👍</button>
                      <button onClick={() => handleFeedback(false, privateMessages[idx - 1]?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #F44336', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👎</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
        </div>

        {/* 👥 팀 워크스페이스 탭 */}
        <div style={{ display: currentTab === 'TEAM' ? 'flex' : 'none', flexDirection: 'column', gap: '15px' }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>AI 비서에게 무엇이든 물어보세요!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                  {msg.sender === 'user' ? '지휘관' : 'AI 어시스턴트'}
                </div>
                <div style={{ 
                  backgroundColor: msg.sender === 'user' ? '#000' : '#f2f2f2', 
                  color: msg.sender === 'user' ? '#fff' : '#000', 
                  padding: '12px 18px', borderRadius: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' 
                }}>
                  {cleanMessageText(msg.text)}
                </div>

                {msg.sender === 'ai' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleFeedback(true, messages[idx - 1]?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #4CAF50', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👍</button>
                    <button onClick={() => handleFeedback(false, messages[idx - 1]?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #F44336', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👎</button>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
        </div>

        {/* 🤖 에이전트 로그 탭 */}
        <div style={{ display: currentTab === 'LOG' ? 'block' : 'none', backgroundColor: '#1e1e2e', color: '#a6accd', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', minHeight: '100%' }}>
            <div style={{ color: '#82aaff', fontWeight: 'bold', marginBottom: '15px' }}>[SYSTEM_LOG] Multi-Agent Workflow Monitoring Started...</div>
            {agentLogs.length === 0 && <div style={{ color: '#555' }}>대기 중...</div>}
            {agentLogs.map((log, idx) => (
              <div key={idx} style={{ margin: '8px 0', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <span style={{ color: '#c3e88d' }}>▶ </span>{log}
              </div>
            ))}
            <div ref={logEndRef} />
        </div>
      </div>

      {/* --- 하단 입력창 --- */}
      <div className="input-bar" style={{ display: 'flex', backgroundColor: '#f2f2f2', borderRadius: '40px', padding: '12px 20px', gap: '15px', alignItems: 'center', margin: '0 40px 20px 40px' }}>
        <select 
          value={selectedAgentId} 
          onChange={(e) => setSelectedAgentId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <option value="">🤖 Dati (기본 AI)</option>
          {agentList.map(agent => (
            <option key={agent.id} value={agent.id}>🎭 {agent.name}</option>
          ))}
        </select>
        <input 
          type="text" 
          className="chat-input" 
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '16px' }} 
          placeholder="명령을 하달해 주십시오..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
        />
        <button 
          className="btn-send" 
          onClick={handleSendMessage} 
          style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}