import { useState, useEffect } from 'react';
import { apiClient } from '../api/axiosInstance';

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://127.0.0.1:8000';

export function useChatSession(workspaceId, currentUserId) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [clarifyData, setClarifyData] = useState(null);

  // 세션 초기화
  useEffect(() => {
    if (!workspaceId || workspaceId === 'null') return;

    const initSession = async () => {
      try {
        const res = await apiClient.post('/api/v1/chats/session', {
          workspaceId,
          title: '기본 채팅방',
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error('세션 초기화 실패:', error);
      }
    };

    initSession();
  }, [workspaceId]);

  // 과거 메시지 불러오기
  useEffect(() => {
    if (!sessionId) return;

    apiClient.get(`/api/v1/chats/session/${sessionId}/messages?isPrivate=false`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMessages(data))
      .catch(err => console.error(err));

    apiClient.get(`/api/v1/chats/session/${sessionId}/messages?isPrivate=true&userId=${currentUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setPrivateMessages(data))
      .catch(err => console.error(err));
  }, [sessionId, currentUserId]);

  // 메시지 전송 + AI 스트리밍
  const sendMessage = async ({ userQuery, currentTab, selectedAgent }) => {
    if (!userQuery.trim() || !sessionId) return;

    const isPrivateMode = currentTab === 'PRIVATE';
    const targetSetMessages = isPrivateMode ? setPrivateMessages : setMessages;
    const currentMessageArray = isPrivateMode ? privateMessages : messages;

    targetSetMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    targetSetMessages(prev => [...prev, { sender: 'ai', text: '' }]);

    // 사용자 메시지 DB 저장 (재로그인 시 복원을 위해)
    apiClient.post('/api/v1/chats/messages', {
      sessionId,
      userId: currentUserId || '',
      senderType: 'USER',
      senderName: '지휘관',
      content: userQuery.replace(/^\[skip\]\s*/g, ''),
      isPrivate: isPrivateMode,
      latency: 0,
      tokens: 0,
    }).catch(e => console.warn('사용자 메시지 저장 실패:', e));

    let aiFullText = '';
    let finalLatency = 0.0;
    let finalTokens = 0;

    // 격리구역 1: AI 스트리밍
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${AI_BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: userQuery,
          session_id: sessionId,
          workspace_id: localStorage.getItem('workspace_id'),
          history: currentMessageArray.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'ai',
            content: (m.text || m.content || '').slice(0, 400),
          })),
          target_agent_name: selectedAgent?.name || null,
          target_agent_prompt: selectedAgent?.description || null,
          existing_dashboard: (() => {
            try { return JSON.parse(sessionStorage.getItem('dativus_canvas_data') || 'null'); }
            catch { return null; }
          })(),
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const event of chunk.split('\n\n')) {
          if (!event.startsWith('data: ')) continue;
          const dataText = event.substring(6);
          if (dataText === '[DONE]') break;
          if (dataText.startsWith('[CLARIFY]')) {
            try {
              const parsed = JSON.parse(dataText.substring(9));
              setClarifyData({ ...parsed, originalQuery: userQuery });
              targetSetMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1].text = `💬 ${parsed.question}`;
                return msgs;
              });
            } catch (e) {
              console.warn('CLARIFY 파싱 실패:', e);
            }
          } else if (dataText.startsWith('[DASHBOARD]')) {
            try {
              const parsed = JSON.parse(dataText.substring(11));
              setDashboardData(parsed);
            } catch (e) {
              console.warn('대시보드 JSON 파싱 실패:', e);
            }
          } else if (dataText.startsWith('[LOG]')) {
            const logMsg = dataText.substring(5);
            setAgentLogs(prev => [...prev, logMsg]);
            if (logMsg.includes('소요 시간:')) {
              finalLatency = parseFloat(logMsg.match(/소요 시간:\s*([\d.]+)초/)?.[1] || 0);
              finalTokens = parseInt(logMsg.match(/소모 토큰:\s*(\d+)/)?.[1] || 0);
            }
          } else {
            aiFullText += (dataText === '' ? '\n' : dataText);
            targetSetMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].text = aiFullText;
              return newMsgs;
            });
          }
        }
      }
    } catch (error) {
      console.error('스트리밍 에러:', error);
      if (aiFullText.length === 0) {
        targetSetMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = '🚨 서버 통신 오류 발생!';
          return newMsgs;
        });
      }
    }

    // 격리구역 2: DB 저장 (역질문 응답은 저장 불필요, 실패해도 채팅창엔 영향 없음)
    if (!aiFullText) return;
    try {
      await apiClient.post('/api/v1/chats/messages', {
        sessionId,
        userId: currentUserId || '',
        senderType: 'LOCAL_AI',
        senderName: 'AI 어시스턴트',
        content: aiFullText,
        isPrivate: isPrivateMode,
        latency: finalLatency,
        tokens: finalTokens,
      });
    } catch (e) {
      console.warn('DB 저장만 실패했습니다 (답변은 보존됨):', e);
    }
  };

  // 팀 공유
  const shareToTeam = async ({ sessionId: sid, content, currentUserId: uid }) => {
    try {
      await apiClient.post('/api/v1/chats/messages', {
        sessionId: sid,
        userId: uid,
        senderType: 'LOCAL_AI',
        senderName: 'AI 공유 브리핑',
        content,
        isPrivate: false,
      });
      setMessages(prev => [...prev, { sender: 'ai', text: `[팀원 공유 메모]\n${content}` }]);
      alert('📢 팀에 공유되었습니다!');
    } catch {
      alert('공유 실패!');
    }
  };

  // 피드백
  const sendFeedback = async ({ workspaceId: wsId, userId, query, answer, isPositive }) => {
    try {
      await apiClient.post('/api/v1/feedback', { workspaceId: wsId, userId, query, answer, isPositive });
    } catch (error) {
      console.error('피드백 전송 실패:', error);
    }
  };

  return {
    sessionId,
    messages,
    privateMessages,
    agentLogs,
    dashboardData,
    clarifyData,
    setClarifyData,
    sendMessage,
    shareToTeam,
    sendFeedback,
  };
}
