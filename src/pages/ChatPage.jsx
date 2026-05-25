import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/axiosInstance';
import dativusLogo from '../assets/Dativus_logo.png';

import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CanvasArea from '../components/CanvasArea';
import UploadModal from '../components/modals/UploadModal';
import DocManagerModal from '../components/modals/DocManagerModal';
import AgentCreateModal from '../components/modals/AgentCreateModal';

import { useChatSession } from '../hooks/useChatSession';
import { useWorkspace } from '../hooks/useWorkspace';
import { useDocuments } from '../hooks/useDocuments';
import { useAgents } from '../hooks/useAgents';

export default function ChatPage() {
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('user_id') || '';
  const workspaceId = localStorage.getItem('workspace_id');

  // --- 모달 열림/닫힘 상태 (UI 제어만) ---
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDocManagerOpen, setIsDocManagerOpen] = useState(false);
  const [isAgentCreateOpen, setIsAgentCreateOpen] = useState(false);

  // --- 캔버스 ---
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasData, setCanvasData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dativus_canvas_data');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // --- 탭 / 입력창 ---
  const [currentTab, setCurrentTab] = useState('TEAM');
  const [input, setInput] = useState('');

  // --- 스크롤 ---
  const chatEndRef = useRef(null);
  const logEndRef = useRef(null);

  // =========================================================================
  // 커스텀 훅 조립
  // =========================================================================
  const {
    sessionId,
    messages, privateMessages, agentLogs,
    dashboardData,
    clarifyData, setClarifyData,
    sendMessage, shareToTeam, sendFeedback,
    isStreaming, currentTrace,
    resetDashboard,
  } = useChatSession(workspaceId, currentUserId);

  // 대시보드 데이터 수신 시 캔버스 자동 오픈 + sessionStorage 동기화
  useEffect(() => {
    if (dashboardData) {
      setCanvasData(dashboardData);
      setIsCanvasOpen(true);
      try {
        sessionStorage.setItem('dativus_canvas_data', JSON.stringify(dashboardData));
      } catch { /* 무시 */ }
    }
  }, [dashboardData]);

  const {
    workspaces,
    newTeamName, setNewTeamName,
    inviteCode, setInviteCode,
    handleCreateTeam, handleJoinTeam,
  } = useWorkspace(currentUserId);

  const {
    docList,
    selectedFile, setSelectedFile,
    isUploading,
    handleFileUpload, handleDeleteDocument,
  } = useDocuments(workspaceId, isDocManagerOpen);

  const {
    agentList,
    agentForm, setAgentForm,
    editingAgent, setEditingAgent,
    selectedAgentId, setSelectedAgentId,
    selectedAgent,
    fetchAgents,
    handleCreateAgent,
    handleUpdateAgent,
    handleDeleteAgent,
  } = useAgents(currentUserId);

  // =========================================================================
  // 가드: 구형 계정 or 비로그인 접근 차단
  // =========================================================================
  useEffect(() => {
    if (!workspaceId || workspaceId === 'null') {
      alert('구형 계정입니다. 새 계정으로 가입하여 샌드박스를 발급받아 주십시오!');
      localStorage.clear();
      navigate('/');
    }
  }, [workspaceId, navigate]);

  // 초기 에이전트 목록 로드
  useEffect(() => { fetchAgents(); }, [currentUserId]);

  // 탭 변경 시 스크롤
  useEffect(() => {
    if (currentTab === 'TEAM' || currentTab === 'PRIVATE') {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else if (currentTab === 'LOG') {
      logEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, privateMessages, agentLogs, currentTab]);

  // =========================================================================
  // 핸들러 (훅 결과를 조립해서 컴포넌트에 전달)
  // =========================================================================
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userQuery = input;
    setInput('');
    await sendMessage({ userQuery, currentTab, selectedAgent, agentList });
  };

  const handleShareToTeam = (content) =>
    shareToTeam({ sessionId, content, currentUserId });

  const handleFeedback = (isPositive, query, answer) =>
    sendFeedback({ workspaceId, userId: currentUserId, query, answer, isPositive });

  const handleClarifySubmit = (selectedOptions, otherText) => {
    const { originalQuery } = clarifyData;
    const extras = [...selectedOptions, otherText].filter(Boolean).join(', ');
    const enrichedQuery = `${originalQuery} [추가 정보: ${extras}]`;
    setClarifyData(null);
    sendMessage({ userQuery: enrichedQuery, currentTab, selectedAgent, agentList });
  };

  const handleResetCanvas = () => {
    setCanvasData(null);
    resetDashboard();
    try { sessionStorage.removeItem('dativus_canvas_data'); } catch { /* 무시 */ }
  };

  const handleClarifyCancel = () => {
    const originalQuery = clarifyData?.originalQuery;
    setClarifyData(null);
    if (originalQuery) {
      sendMessage({ userQuery: `[skip] ${originalQuery}`, currentTab, selectedAgent, agentList });
    }
  };

  const handleSetCurrentTab = (tab) => {
    if (tab !== currentTab) setClarifyData(null);
    setCurrentTab(tab);
  };

  // =========================================================================
  // 렌더링
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>

      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 50px', borderBottom: '1px solid #eee' }}>
        <img src={dativusLogo} alt="Dativus" style={{ height: '30px', objectFit: 'contain' }} />
        <div className="top-nav">
          <button className="btn-top-login" onClick={() => navigate('/mypage')} style={{ marginRight: '10px' }}>마이페이지</button>
          <button className="btn-top-login" onClick={() => apiClient.logout()}>로그아웃</button>
        </div>
      </header>

      <div className="layout-grid" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          setIsUploadOpen={setIsUploadOpen}
          setIsDocManagerOpen={setIsDocManagerOpen}
          setIsAgentCreateOpen={setIsAgentCreateOpen}
          agentList={agentList}
          editingAgent={editingAgent} setEditingAgent={setEditingAgent}
          handleUpdateAgent={handleUpdateAgent} handleDeleteAgent={handleDeleteAgent}
          newTeamName={newTeamName} setNewTeamName={setNewTeamName} handleCreateTeam={handleCreateTeam}
          inviteCode={inviteCode} setInviteCode={setInviteCode} handleJoinTeam={handleJoinTeam}
          workspaces={workspaces} workspaceId={workspaceId}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ChatArea
            currentTab={currentTab} setCurrentTab={handleSetCurrentTab}
            isCanvasOpen={isCanvasOpen} setIsCanvasOpen={setIsCanvasOpen}
            privateMessages={privateMessages} messages={messages} agentLogs={agentLogs}
            chatEndRef={chatEndRef} logEndRef={logEndRef}
            handleShareToTeam={handleShareToTeam} handleFeedback={handleFeedback}
            selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} agentList={agentList}
            input={input} setInput={setInput} handleSendMessage={handleSendMessage}
            clarifyData={clarifyData}
            onClarifySubmit={handleClarifySubmit}
            onClarifyCancel={handleClarifyCancel}
            isStreaming={isStreaming} currentTrace={currentTrace}
          />
          <CanvasArea
            isCanvasOpen={isCanvasOpen} setIsCanvasOpen={setIsCanvasOpen} canvasData={canvasData}
            onReset={handleResetCanvas}
          />
        </div>
      </div>

      {/* 모달 */}
      {isUploadOpen && (
        <UploadModal
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isUploading={isUploading}
          onUpload={handleFileUpload}
          onClose={() => { setIsUploadOpen(false); setSelectedFile(null); }}
        />
      )}

      {isDocManagerOpen && (
        <DocManagerModal
          docList={docList}
          onDelete={handleDeleteDocument}
          onClose={() => setIsDocManagerOpen(false)}
        />
      )}

      {isAgentCreateOpen && (
        <AgentCreateModal
          agentForm={agentForm}
          setAgentForm={setAgentForm}
          onCreate={handleCreateAgent}
          onClose={() => setIsAgentCreateOpen(false)}
        />
      )}

    </div>
  );
}
