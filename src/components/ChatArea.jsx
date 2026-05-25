import { memo, useState, useEffect } from 'react';
import AgentDashboard from './AgentDashboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function TraceStepperBubble({ trace }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setPhase(p => (p + 1) % 3), 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '12px 5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#555',
            opacity: phase === i ? 1 : 0.2, transition: 'opacity 0.25s ease',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '13px', color: '#777', fontStyle: 'italic', maxWidth: '360px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {trace || '요원들을 소집하는 중...'}
      </div>
    </div>
  );
}

// 메시지 버블을 memo로 감싸서 타이핑 시 리렌더 방지
const MessageBubble = memo(({ msg, idx, prevMsg, handleShareToTeam, handleFeedback, isPrivate, isLastMsg, isStreaming, currentTrace }) => {
  const cleanMessageText = (text, isUser = false) => {
    if (!text) return "";
    let cleaned = text;
    if (isUser) {
      // [skip] 마커 제거
      cleaned = cleaned.replace(/^\[skip\]\s*/g, '');
      // [추가 정보: X] → "→ X" 로 변환
      cleaned = cleaned.replace(/\s*\[추가 정보:\s*([^\]]+)\]/g, '\n→ $1');
      return cleaned.trim();
    }
    // LLM이 2개 백틱으로 코드블록을 잘못 생성하는 경우 3개로 정규화 (먼저 처리)
    cleaned = cleaned.replace(/(?:^|\n)``(\w*)\n([\s\S]*?)``(?=\n|$)/g, (_, lang, code) => {
      return '\n```' + lang + '\n' + code + '```';
    });

    // 코드블록을 임시 보관 후 정규식 적용, 마지막에 복원
    const codeBlocks = [];
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `\x00CODE${codeBlocks.length - 1}\x00`;
    });

    const starRegex = /\*\*json:(?:DASHBOARD|CANVAS)[\s\S]*?\*\*/gi;
    cleaned = cleaned.replace(starRegex, '');
    const marker = String.fromCharCode(96, 96, 96);
    const pattern = marker + "(?:json:DASHBOARD|json:CANVAS|json)?[\\s\\S]*?({[\\s\\S]*?})[\\s\\S]*?" + marker;
    cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
    cleaned = cleaned.replace(/\*\*DASHBOARD\*\*/gi, '').replace(/DASHBOARD/gi, '');
    // 한글 문장 끝 → 줄바꿈 (공백 유무 무관)
    cleaned = cleaned.replace(/([가-힣])\.\s*(?=[가-힣a-zA-Z0-9*])/g, '$1.\n\n');
    // 영문 뒤 점 → 공백이 있을 때만 줄바꿈 (React.js, node.js 등 파일명 보호)
    cleaned = cleaned.replace(/([a-zA-Z])\.\s+(?=[가-힣A-Z*])/g, '$1.\n\n');
    cleaned = cleaned.replace(/(?=\*\*?A안|\*\*?B안|\*\*?C안)/g, '\n\n');
    cleaned = cleaned.replace(/(?=\*\*장점|\*\*단점)/g, '\n\n');
    // 헤더(###) 앞 빈 줄 보장
    cleaned = cleaned.replace(/([^\n])\n(#{1,4} )/g, '$1\n\n$2');
    // 불릿 포인트 앞 빈 줄 보장 (remarkBreaks가 \n→<br> 변환해 리스트 인식 방해하는 것 방지)
    cleaned = cleaned.replace(/([^\n])\n([-*] )/g, '$1\n\n$2');
    cleaned = cleaned.replace(/\n\s*\n+/g, '\n\n');

    // 코드블록 복원
    cleaned = cleaned.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);

    // 테이블 정규화: 각 행에 선행/후행 | 보장, 구분자 행 수정
    cleaned = cleaned.replace(/^([^\n]*\|[^\n]*)$/gm, (row) => {
      let r = row.trim();
      if (!r.startsWith('|')) r = '| ' + r;
      if (!r.endsWith('|')) r = r + ' |';
      return r;
    });
    // 구분자 행(--- | --- |)의 열 수를 직전 헤더 행 기준으로 맞춤
    cleaned = cleaned.replace(/(^\|[^\n]+\|\n)(^\|[\s|:-]+\|)$/gm, (_, header, sep) => {
      const colCount = (header.match(/\|/g) || []).length - 1;
      return header + '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    });

    return cleaned.trim();
  };

  const senderLabel = msg.sender === 'user'
    ? (isPrivate ? '지휘관 (비밀)' : '지휘관')
    : (isPrivate ? 'AI 어시스턴트 (비밀)' : 'AI 어시스턴트');

  return (
    <div style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
        {senderLabel}
      </div>
      <div style={{
        backgroundColor: msg.sender === 'user' ? '#000' : 'transparent',
        color: msg.sender === 'user' ? '#fff' : '#333',
        padding: msg.sender === 'user' ? '12px 18px' : '12px 5px',
        borderRadius: '12px', lineHeight: '1.6'
      }}>
        {msg.sender === 'ai' && isLastMsg && isStreaming && msg.text === ''
          ? <TraceStepperBubble trace={currentTrace} />
          : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                // 헤더: 채팅 UI에서 너무 크면 이상해서 p로 렌더
                h1: ({children}) => <p style={{fontWeight:'700', fontSize:'15px', margin:'10px 0 4px', color:'#111'}}>{children}</p>,
                h2: ({children}) => <p style={{fontWeight:'700', fontSize:'14px', margin:'8px 0 4px', color:'#111'}}>{children}</p>,
                h3: ({children}) => <p style={{fontWeight:'700', fontSize:'13px', margin:'6px 0 4px', color:'#222'}}>{children}</p>,
                h4: ({children}) => <p style={{fontWeight:'700', fontSize:'13px', margin:'4px 0 2px', color:'#333'}}>{children}</p>,
                // 문단 간격
                p: ({children}) => <p style={{margin:'3px 0', lineHeight:'1.7'}}>{children}</p>,
                // 인용 블록 — 💡 시작 시 초록(커스텀 에이전트), 나머지는 파란(요약/Next Step)
                blockquote: ({children}) => {
                  const text = typeof children === 'string' ? children
                    : Array.isArray(children) ? children.map(c => (typeof c === 'string' ? c : c?.props?.children ?? '')).join('') : '';
                  const isCustomAgent = text.includes('💡');
                  return (
                    <blockquote style={{
                      borderLeft: `3px solid ${isCustomAgent ? '#22c55e' : '#3b82f6'}`,
                      backgroundColor: isCustomAgent ? '#f0fdf4' : '#f0f7ff',
                      margin: '8px 0',
                      padding: '6px 12px',
                      borderRadius: '0 6px 6px 0',
                      color: isCustomAgent ? '#15803d' : '#1e40af',
                    }}>
                      {children}
                    </blockquote>
                  );
                },
                // pre는 SyntaxHighlighter가 직접 처리하므로 투명 래퍼만
                pre: ({children}) => <>{children}</>,
                // 인라인 코드 vs 블록 코드 구분
                code: ({className, children}) => {
                  const language = (className || '').replace('language-', '') || 'text';
                  const codeStr = String(children || '').replace(/\n$/, '');
                  const isBlock = className || codeStr.includes('\n');
                  if (isBlock) {
                    return (
                      <SyntaxHighlighter
                        language={language}
                        style={atomOneDark}
                        customStyle={{
                          borderRadius: '8px',
                          fontSize: '13px',
                          margin: '8px 0',
                          lineHeight: '1.6',
                          padding: '14px 16px',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                        }}
                        codeTagProps={{ style: { background: 'transparent', whiteSpace: 'pre', fontFamily: "'Consolas','D2Coding',monospace" } }}
                        PreTag={({ children, ...rest }) => <pre {...rest} style={{ ...rest.style, whiteSpace: 'pre', margin: 0 }}>{children}</pre>}
                        showLineNumbers={codeStr.split('\n').length > 5}
                        wrapLongLines={false}
                      >
                        {codeStr}
                      </SyntaxHighlighter>
                    );
                  }
                  return (
                    <code style={{
                      backgroundColor: '#f0f0f0',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      fontSize: '13px',
                      fontFamily: "'Consolas','D2Coding',monospace",
                      color: '#d63384',
                    }}>
                      {children}
                    </code>
                  );
                },
                // 링크: 새 탭으로
                a: ({href, children}) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{color:'#2196f3', textDecoration:'underline'}}>
                    {children}
                  </a>
                ),
                // 목록 간격
                ul: ({children}) => <ul style={{paddingLeft:'20px', margin:'4px 0'}}>{children}</ul>,
                ol: ({children}) => <ol style={{paddingLeft:'20px', margin:'4px 0'}}>{children}</ol>,
                li: ({children}) => <li style={{marginBottom:'2px', lineHeight:'1.6'}}>{children}</li>,
                // 구분선
                hr: () => <hr style={{border:'none', borderTop:'1px solid #e0e0e0', margin:'12px 0'}} />,
                // 표
                table: ({children}) => (
                  <div style={{overflowX:'auto', margin:'10px 0'}}>
                    <table style={{borderCollapse:'collapse', width:'100%', fontSize:'13px'}}>{children}</table>
                  </div>
                ),
                th: ({children}) => <th style={{border:'1px solid #ddd', padding:'6px 12px', backgroundColor:'#f5f5f5', textAlign:'left', fontWeight:'600', whiteSpace:'nowrap'}}>{children}</th>,
                td: ({children}) => <td style={{border:'1px solid #ddd', padding:'6px 12px', verticalAlign:'top'}}>{children}</td>,
                tr: ({children}) => <tr style={{borderBottom:'1px solid #eee'}}>{children}</tr>,
              }}
            >
              {cleanMessageText(msg.text, msg.sender === 'user')}
            </ReactMarkdown>
          )
        }
      </div>
      {msg.sender === 'ai' && (
        <div style={{ display: 'flex', justifyContent: isPrivate ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: '6px' }}>
          {isPrivate && (
            <button onClick={() => handleShareToTeam(msg.text)}
              style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e1bee7', color: '#4a148c', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              📢 팀 워크스페이스로 대화 공유
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleFeedback(true, prevMsg?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #4CAF50', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👍</button>
            <button onClick={() => handleFeedback(false, prevMsg?.text, msg.text)} style={{ background: 'transparent', border: '1px solid #F44336', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}>👎</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default function ChatArea({
  currentTab, setCurrentTab,
  isCanvasOpen, setIsCanvasOpen,
  privateMessages, messages, agentLogs,
  chatEndRef, logEndRef,
  handleShareToTeam, handleFeedback,
  selectedAgentId, setSelectedAgentId, agentList,
  input, setInput, handleSendMessage,
  clarifyData, onClarifySubmit, onClarifyCancel,
  isStreaming, currentTrace,
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [clarifyOther, setClarifyOther] = useState('');
  // 새 질문마다 AgentDashboard를 완전히 리마운트 → 이전 질문의 색상 잔재 제거
  const [agentKey, setAgentKey] = useState(0);
  const bumpAgentKey = () => setAgentKey(k => k + 1);

  useEffect(() => {
    setSelectedOptions([]);
    setClarifyOther('');
  }, [clarifyData]);

  // 역질문 카드가 열려 있을 때 Enter 키로 바로 제출
  useEffect(() => {
    if (!clarifyData) return;
    const handleGlobalEnter = (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      // 기타 입력 필드에서의 Enter는 해당 input의 onKeyDown이 처리
      if (e.target.classList.contains('clarify-other-input')) return;
      if (selectedOptions.length > 0 || clarifyOther.trim()) {
        bumpAgentKey();
        onClarifySubmit(selectedOptions, clarifyOther);
        setSelectedOptions([]);
        setClarifyOther('');
      }
    };
    document.addEventListener('keydown', handleGlobalEnter);
    return () => document.removeEventListener('keydown', handleGlobalEnter);
  }, [clarifyData, selectedOptions, clarifyOther, onClarifySubmit]);

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
          <span style={{ cursor: 'pointer', color: currentTab === 'LOG' ? '#000' : '#888', transition: '0.2s' }} onClick={() => setCurrentTab('LOG')}>📡 워크플로우</span>
        </div>

        <button
          onClick={() => setIsCanvasOpen(!isCanvasOpen)}
          style={{
            padding: '6px 12px',
            backgroundColor: isCanvasOpen ? '#333' : '#2196f3',
            color: '#fff', border: 'none', borderRadius: '6px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
            transition: 'background-color 0.3s'
          }}
        >
          {isCanvasOpen ? '캔버스 닫기' : '📊 캔버스 열기'}
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
              <MessageBubble key={idx} msg={msg} idx={idx} prevMsg={privateMessages[idx - 1]}
                handleShareToTeam={handleShareToTeam} handleFeedback={handleFeedback} isPrivate={true}
                isLastMsg={idx === privateMessages.length - 1}
                isStreaming={isStreaming} currentTrace={currentTrace} />
            ))}
            <div ref={chatEndRef} />
        </div>

        {/* 👥 팀 워크스페이스 탭 */}
        <div style={{ display: currentTab === 'TEAM' ? 'flex' : 'none', flexDirection: 'column', gap: '15px' }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>AI 비서에게 무엇이든 물어보세요!</div>}
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} idx={idx} prevMsg={messages[idx - 1]}
                handleShareToTeam={handleShareToTeam} handleFeedback={handleFeedback} isPrivate={false}
                isLastMsg={idx === messages.length - 1}
                isStreaming={isStreaming} currentTrace={currentTrace} />
            ))}
            <div ref={chatEndRef} />
        </div>

        {/* 🤖 에이전트 대시보드 탭 */}
        <div style={{ display: currentTab === 'LOG' ? 'block' : 'none', minHeight: '100%' }}>
          <AgentDashboard
            key={agentKey}
            agentLogs={agentLogs}
            isStreaming={isStreaming}
            currentTrace={currentTrace}
            logEndRef={logEndRef}
            customAgentList={agentList.filter(a => !a._builtin)}
          />
        </div>
      </div>

      {/* --- 역질문 카드 --- */}
      {clarifyData && (
        <div style={{
          margin: '0 40px 10px 40px',
          padding: '16px 20px',
          backgroundColor: '#f0f7ff',
          border: '1px solid #b3d4f7',
          borderRadius: '12px',
        }}>
          <div style={{ fontWeight: 'bold', color: '#1a56a0', marginBottom: '12px', fontSize: '14px' }}>
            💬 {clarifyData.question}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {clarifyData.options.map(opt => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                backgroundColor: selectedOptions.includes(opt) ? '#1a56a0' : '#fff',
                color: selectedOptions.includes(opt) ? '#fff' : '#333',
                border: '1px solid #b3d4f7',
                borderRadius: '20px',
                cursor: 'pointer', fontSize: '13px',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}>
                <input
                  type={clarifyData.multi_select ? 'checkbox' : 'radio'}
                  name="clarify-opt"
                  value={opt}
                  checked={selectedOptions.includes(opt)}
                  onChange={() => {
                    if (clarifyData.multi_select) {
                      setSelectedOptions(prev =>
                        prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
                      );
                    } else {
                      setSelectedOptions([opt]);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                {opt}
              </label>
            ))}
          </div>
          <input
            type="text"
            className="clarify-other-input"
            placeholder="기타 직접 입력..."
            value={clarifyOther}
            onChange={e => setClarifyOther(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (selectedOptions.length > 0 || clarifyOther.trim())) {
                bumpAgentKey();
                onClarifySubmit(selectedOptions, clarifyOther);
                setSelectedOptions([]);
                setClarifyOther('');
              }
            }}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              border: '1px solid #ddd', outline: 'none', fontSize: '13px',
              marginBottom: '12px', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClarifyCancel}
              style={{ padding: '6px 16px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
            >
              그냥 보내기
            </button>
            <button
              onClick={() => {
                if (selectedOptions.length === 0 && !clarifyOther.trim()) return;
                bumpAgentKey();
                onClarifySubmit(selectedOptions, clarifyOther);
              }}
              style={{
                padding: '6px 16px', background: '#1a56a0', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold',
                opacity: (selectedOptions.length === 0 && !clarifyOther.trim()) ? 0.4 : 1,
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* --- 하단 입력창 --- */}
      <div className="input-bar" style={{ display: 'flex', backgroundColor: '#f2f2f2', borderRadius: '40px', padding: '12px 20px', gap: '15px', alignItems: 'center', margin: '0 40px 20px 40px' }}>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <option value="">🤖 Dati (자동)</option>
          <optgroup label="── 부서 직접 선택 ──">
            <option value="general_agent">💬 일반 대화</option>
            <option value="expert_agent">🔬 전문 분석</option>
            <option value="coding_math_agent">💻 코딩 / 수학</option>
          </optgroup>
          {agentList.length > 0 && (
            <optgroup label="── 나의 에이전트 ──">
              {agentList.map(agent => (
                <option key={agent.id} value={agent.id}>🎭 {agent.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="text"
          className="chat-input"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '16px', opacity: clarifyData ? 0.4 : 1 }}
          placeholder={clarifyData ? '위 선택지를 먼저 선택해 주세요' : isStreaming ? '응답을 기다리는 중...' : '명령을 하달해 주십시오...'}
          value={input}
          disabled={!!clarifyData || isStreaming}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { bumpAgentKey(); handleSendMessage(); } }}
        />
        <button
          className="btn-send"
          onClick={() => { bumpAgentKey(); handleSendMessage(); }}
          disabled={!!clarifyData || isStreaming}
          style={{ background: (clarifyData || isStreaming) ? '#aaa' : '#000', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: (clarifyData || isStreaming) ? 'not-allowed' : 'pointer', fontWeight: 'bold', flexShrink: 0 }}
        >

        </button>
      </div>
    </div>
  );
}