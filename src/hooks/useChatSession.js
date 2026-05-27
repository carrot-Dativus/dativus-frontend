import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/axiosInstance';
import { useTeamSync } from './useTeamSync';

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://127.0.0.1:8000';


// ── localStorage 캐시 헬퍼 ──────────────────────────────────────────────────
const sessionCacheKey = (sessionId) => `dativus_chat_${sessionId}`;

function saveMsgs(key, msgs) {
  try { localStorage.setItem(key, JSON.stringify(msgs)); } catch {}
}
function loadMsgs(key) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; }
}

// ── DB 응답 변환 (캐시가 없을 때만 사용) ────────────────────────────────────
function transformMsg(msg) {
  const senderType = msg.senderType ?? (msg.sender === 'user' ? 'USER' : 'LOCAL_AI');
  const senderName = msg.senderName ?? '';
  const content    = msg.content ?? msg.text ?? '';
  return {
    sender:    senderType === 'USER' ? 'user' : senderName.startsWith('AGENT:') ? 'custom_agent' : 'ai',
    text:      content,
    agentName: senderName.startsWith('AGENT:') ? senderName.slice(6) : undefined,
    senderName: senderType === 'USER' ? senderName : undefined,
  };
}

function sortAndTransform(data) {
  const list = Array.isArray(data) ? [...data] : [];
  list.sort((a, b) => {
    // 1순위: createdAt (턴 간 순서)
    if (a.createdAt && b.createdAt) {
      const dt = new Date(a.createdAt) - new Date(b.createdAt);
      if (dt !== 0) return dt;
    }
    // 2순위: messageOrder (같은 턴 내 순서 — 0=사용자, 1=AI, 2+=에이전트)
    if (a.messageOrder != null && b.messageOrder != null && a.messageOrder !== b.messageOrder)
      return a.messageOrder - b.messageOrder;
    // 3순위: id
    if (a.id != null && b.id != null) return a.id - b.id;
    return 0;
  });
  return list.map(transformMsg);
}

// teamSessionId: 팀 탭에서 보여줄 세션 (팀 채팅방 선택)
// privateSessionId: 개인 공간 탭에서 보여줄 세션 (개인 AI 채팅 선택)
export function useChatSession(workspaceId, currentUserId, teamSessionId, privateSessionId) {
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [clarifyData, setClarifyData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTrace, setCurrentTrace] = useState('');

  // 팀 탭 실시간 동기화 (WebSocket) — 현재 선택된 채널 메시지만 수신
  const teamSessionIdRef = useRef(teamSessionId);
  useEffect(() => { teamSessionIdRef.current = teamSessionId; }, [teamSessionId]);

  const handleTeamMessage = useCallback((msg) => {
    if (teamSessionIdRef.current && msg.sessionId && msg.sessionId !== teamSessionIdRef.current) return;
    // WS 페이로드의 senderName을 메시지 객체에 포함
    setMessages(prev => [...prev, { ...msg, senderName: msg.senderName || '' }]);
  }, []);
  useTeamSync(workspaceId, currentUserId, handleTeamMessage);

  // "로드 완료" ref — 세션 전환 중에는 null로 두어 잘못된 캐시 저장 방지
  const teamLoadedRef = useRef(null);
  const privateLoadedRef = useRef(null);

  // 팀 세션 전환 → messages 초기화 후 로드
  useEffect(() => {
    setMessages([]);
    teamLoadedRef.current = null;
    if (!teamSessionId) return;
    const key = `${sessionCacheKey(teamSessionId)}_team`;
    const cached = loadMsgs(key);
    if (cached?.length > 0) {
      teamLoadedRef.current = teamSessionId;
      setMessages(cached);
      return;
    }
    apiClient.get(`/api/v1/chats/session/${teamSessionId}/messages?isPrivate=false`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        teamLoadedRef.current = teamSessionId;
        setMessages(sortAndTransform(data));
      })
      .catch(err => console.error(err));
  }, [teamSessionId]);

  // 개인 세션 전환 → privateMessages 초기화 후 로드
  useEffect(() => {
    setPrivateMessages([]);
    privateLoadedRef.current = null;
    if (!privateSessionId) return;
    const key = sessionCacheKey(privateSessionId);
    const cached = loadMsgs(key);
    if (cached?.length > 0) {
      privateLoadedRef.current = privateSessionId;
      setPrivateMessages(cached);
      return;
    }
    apiClient.get(`/api/v1/chats/session/${privateSessionId}/messages?isPrivate=true`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        privateLoadedRef.current = privateSessionId;
        setPrivateMessages(sortAndTransform(data));
      })
      .catch(err => console.error(err));
  }, [privateSessionId]);

  // 캐시 저장 — 로드 완료된 세션만 저장 (전환 중 잘못된 키로 저장 방지)
  useEffect(() => {
    if (teamSessionId && teamSessionId === teamLoadedRef.current && messages.length > 0)
      saveMsgs(`${sessionCacheKey(teamSessionId)}_team`, messages);
  }, [messages, teamSessionId]);

  useEffect(() => {
    if (privateSessionId && privateSessionId === privateLoadedRef.current && privateMessages.length > 0)
      saveMsgs(sessionCacheKey(privateSessionId), privateMessages);
  }, [privateMessages, privateSessionId]);

  // 메시지 전송 + AI 스트리밍
  const sendMessage = async ({ userQuery, currentTab, selectedAgent, agentList = [], existingDashboard = null, channelMode = 'AI' }) => {
    const isPrivateMode = currentTab === 'PRIVATE';
    const isChatOnly = channelMode === 'CHAT';
    const activeSessionId = isPrivateMode ? privateSessionId : teamSessionId;
    if (!userQuery.trim() || !activeSessionId) return;

    const personaMemo = localStorage.getItem('persona_memo') || '';
    const myName = localStorage.getItem('username') || '팀원';

    const targetSetMessages = isPrivateMode ? setPrivateMessages : setMessages;
    const currentMessageArray = isPrivateMode ? privateMessages : messages;

    targetSetMessages(prev => [...prev, { sender: 'user', text: userQuery, senderName: myName }]);
    if (!isChatOnly) targetSetMessages(prev => [...prev, { sender: 'ai', text: '' }]);

    // 사용자 메시지 DB 저장
    const userMsgSavePromise = apiClient.post('/api/v1/chats/messages', {
      sessionId: activeSessionId,
      userId: currentUserId || '',
      senderType: 'USER',
      senderName: myName,
      content: userQuery.replace(/^\[skip\]\s*/g, ''),
      isPrivate: isPrivateMode,
      latency: 0,
      tokens: 0,
      messageOrder: 0,
    }).catch(e => console.warn('사용자 메시지 저장 실패:', e));

    // 팀 채팅 전용 채널: DB 저장만 하고 AI 호출 없이 종료
    if (isChatOnly) {
      await userMsgSavePromise;
      return;
    }

    let aiFullText = '';              // 메인 답변 (DB 저장용)
    let inMultiAgent = false;         // 다중 에이전트 스트리밍 중 여부
    let currentAgentName = '';        // 현재 스트리밍 중인 에이전트 이름
    let currentAgentText = '';        // 현재 에이전트 누적 텍스트
    let completedAgentResponses = []; // 완료된 에이전트 응답 [{name, text}] — 메인 답변 저장 후 순서대로 저장
    let finalLatency = 0.0;
    let finalTokens = 0;

    // 격리구역 1: AI 스트리밍
    setIsStreaming(true);
    setCurrentTrace('');
    setAgentLogs([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${AI_BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: userQuery,
          session_id: activeSessionId,
          workspace_id: localStorage.getItem('workspace_id'),
          history: currentMessageArray.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'ai',
            content: (m.text || m.content || '').slice(0, 400),
          })),
          // 빌트인 선택 → force_agent / 커스텀 수동 선택 → target_agent_* / 자동(Dati) → custom_agents_list로 자동 매칭
          force_agent: selectedAgent?._builtin ? selectedAgent.id : null,
          target_agent_name: (!selectedAgent?._builtin && selectedAgent?.name) ? selectedAgent.name : null,
          target_agent_prompt: (!selectedAgent?._builtin && selectedAgent?.description) ? selectedAgent.description : null,
          custom_agents_list: (!selectedAgent && agentList.length > 0)
            ? agentList.filter(a => !a._builtin).map(a => ({ name: a.name, description: a.description, threshold: a.threshold ?? 0.38 }))
            : [],
          persona_memo: personaMemo,
          existing_dashboard: existingDashboard ?? null,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';  // 청크 경계에서 잘린 이벤트를 보관하는 버퍼
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        // 버퍼에 누적 후 \n\n 기준으로 완성된 이벤트만 처리
        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() ?? '';  // 마지막 불완전한 조각은 다음 청크까지 보관

        for (const event of events) {
          // 멀티라인 SSE 지원: 이벤트 내 모든 data: 필드를 \n으로 합산
          const dataLines = event.split('\n')
            .filter(l => l.startsWith('data: '))
            .map(l => l.substring(6));
          if (dataLines.length === 0) continue;
          const dataText = dataLines.join('\n').replace(/\n$/, '');

          if (dataText === '[DONE]') { streamDone = true; break; }
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
          } else if (dataText.startsWith('[ROUTE]')) {
            const routeKey = dataText.substring(7);
            const routeLabels = { general_agent: '일반', expert_agent: '전문가', coding_math_agent: '코딩/수학' };
            const routeLabel = routeLabels[routeKey] || '일반';
            apiClient.post('/api/v1/agents/usage', {
              userId: currentUserId,
              workspaceId,
              agentName: routeLabel,
            }).catch(() => {});
          } else if (dataText.startsWith('[LOG]')) {
            const logMsg = dataText.substring(5);
            setAgentLogs(prev => [...prev, logMsg]);
            if (aiFullText === '') setCurrentTrace(logMsg);
            if (logMsg.includes('소요 시간:')) {
              finalLatency = parseFloat(logMsg.match(/소요 시간:\s*([\d.]+)초/)?.[1] || 0);
              finalTokens = parseInt(logMsg.match(/소모 토큰:\s*(\d+)/)?.[1] || 0);
            }
          } else if (dataText.startsWith('[AGENT_START:')) {
            // 이전 에이전트가 AGENT_END 없이 연속 시작되는 경우 대기열에 추가
            if (currentAgentName && currentAgentText) {
              completedAgentResponses.push({ name: currentAgentName, text: currentAgentText });
            }
            // 새 에이전트 버블 생성
            const agentName = dataText.slice(13, -1);
            inMultiAgent = true;
            currentAgentName = agentName;
            currentAgentText = '';
            targetSetMessages(prev => [...prev, { sender: 'custom_agent', agentName, text: '' }]);
          } else if (dataText === '[AGENT_END]') {
            // 완료된 에이전트 응답을 대기열에 추가 (메인 답변 저장 후 순서대로 DB 저장)
            if (currentAgentName && currentAgentText) {
              completedAgentResponses.push({ name: currentAgentName, text: currentAgentText });
              currentAgentName = '';
              currentAgentText = '';
            }
          } else {
            if (aiFullText === '' && !inMultiAgent) setCurrentTrace('');
            const chunk = dataText === '' ? '\n' : dataText;
            if (!inMultiAgent) {
              // 메인 답변 축적
              aiFullText += chunk;
              targetSetMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = aiFullText;
                return newMsgs;
              });
            } else {
              // 다중 에이전트 버블에 텍스트 추가 + DB 저장용 누적
              currentAgentText += chunk;
              targetSetMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                  ...newMsgs[newMsgs.length - 1],
                  text: newMsgs[newMsgs.length - 1].text + chunk,
                };
                return newMsgs;
              });
            }
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
    } finally {
      setIsStreaming(false);
      setCurrentTrace('');
    }

    // 격리구역 2: DB 저장
    if (!aiFullText) return;
    await userMsgSavePromise;
    let msgOrder = 1;
    try {
      await apiClient.post('/api/v1/chats/messages', {
        sessionId: activeSessionId,
        userId: currentUserId || '',
        senderType: 'LOCAL_AI',
        senderName: 'AI 어시스턴트',
        content: aiFullText,
        isPrivate: isPrivateMode,
        latency: finalLatency,
        tokens: finalTokens,
        messageOrder: msgOrder,
      });
    } catch (e) {
      console.warn('DB 저장만 실패했습니다 (답변은 보존됨):', e);
    }
    for (const agent of completedAgentResponses) {
      msgOrder += 1;
      try {
        await apiClient.post('/api/v1/chats/messages', {
          sessionId: activeSessionId,
          userId: currentUserId || '',
          senderType: 'LOCAL_AI',
          senderName: `AGENT:${agent.name}`,
          content: agent.text,
          isPrivate: isPrivateMode,
          latency: 0,
          tokens: 0,
          messageOrder: msgOrder,
        });
      } catch (e) {
        console.warn(`에이전트 메시지 저장 실패 (${agent.name}):`, e);
      }
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
      alert('팀에 공유되었습니다!');
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

  const removeMessage = useCallback((msg, isPrivate) => {
    if (isPrivate) {
      setPrivateMessages(prev => prev.filter(m => m !== msg));
    } else {
      setMessages(prev => prev.filter(m => m !== msg));
    }
  }, []);

  const resetDashboard = () => setDashboardData(null);

  return {
    sessionId: teamSessionId,  // 팀 공유 등 기존 코드 호환용
    messages,
    privateMessages,
    agentLogs,
    dashboardData,
    clarifyData,
    setClarifyData,
    sendMessage,
    shareToTeam,
    sendFeedback,
    removeMessage,
    isStreaming,
    currentTrace,
    resetDashboard,
  };
}
