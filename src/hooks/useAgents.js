import { useState } from 'react';
import { apiClient } from '../api/axiosInstance';

export function useAgents(currentUserId) {
  const [agentList, setAgentList] = useState([]);
  const [agentForm, setAgentForm] = useState({ name: '', description: '', agentType: 'LOCAL' });
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const fetchAgents = async () => {
    if (!currentUserId) return;
    try {
      const res = await apiClient.get(`/api/v1/agents/user/${currentUserId}`);
      if (res.ok) setAgentList(await res.json());
    } catch {
      console.error('자아 목록 로드 실패');
    }
  };

  const handleCreateAgent = async (onSuccess) => {
    if (!agentForm.name.trim() || !agentForm.description.trim()) {
      alert('요원의 이름과 성격을 모두 입력해 주십시오!');
      return;
    }
    try {
      const res = await apiClient.post('/api/v1/agents', {
        userId: currentUserId,
        name: agentForm.name,
        description: agentForm.description,
        agentType: agentForm.agentType,
      });
      if (res.ok) {
        alert('🤖 새로운 자아가 각인되었습니다!');
        setAgentForm({ name: '', description: '', agentType: 'LOCAL' });
        fetchAgents();
        onSuccess?.();
      } else {
        alert('자아 생성 실패!');
      }
    } catch {
      alert('통신 오류 발생!');
    }
  };

  // 현재 선택된 에이전트 객체 반환 (스트리밍 시 사용)
  const selectedAgent = agentList.find(a => a.id === selectedAgentId) || null;

  return {
    agentList,
    agentForm, setAgentForm,
    selectedAgentId, setSelectedAgentId,
    selectedAgent,
    fetchAgents,
    handleCreateAgent,
  };
}
