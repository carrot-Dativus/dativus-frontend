import { useEffect, useRef } from 'react';

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080')
  .replace(/^http/, 'ws');

export function useTeamSync(workspaceId, currentUserId, onTeamMessage) {
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const callbackRef = useRef(onTeamMessage);

  useEffect(() => { callbackRef.current = onTeamMessage; }, [onTeamMessage]);

  useEffect(() => {
    if (!workspaceId || workspaceId === 'null') return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const token = localStorage.getItem('token');
      const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${workspaceId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => console.log('[WS] 팀 탭 연결됨');

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.sourceUserId && msg.sourceUserId === currentUserId) return;
          callbackRef.current?.(msg);
        } catch {}
      };

      ws.onclose = () => {
        // destroyed면 재연결 안 함 (StrictMode 이중 실행 방지)
        if (!destroyed) timerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [workspaceId, currentUserId]);
}
