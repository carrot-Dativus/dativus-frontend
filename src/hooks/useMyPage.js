import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/axiosInstance';

export function useMyPage() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('user_id');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('로딩 중...');
  const [decisionStyle, setDecisionStyle] = useState('일반적인');
  const [expertise, setExpertise] = useState('기본');
  const [tone, setTone] = useState('친절한');
  const [stats, setStats] = useState({ totalInteractions: 0, csatScore: 0, failureLogs: [] });

  useEffect(() => {
    if (!currentUserId) {
      alert('비정상적인 접근입니다.');
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const profileRes = await apiClient.get(`/api/v1/users/${currentUserId}`);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setEmail(data.email);
          setUsername(data.username);
          setDecisionStyle(data.decisionStyle);
          setExpertise(data.expertise);
          setTone(data.tone);
        }

        const statsRes = await apiClient.get(`/api/v1/feedback/stats/${currentUserId}`);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (error) {
        console.error('데이터 동기화 실패:', error);
      }
    };

    fetchData();
  }, [currentUserId, navigate]);

  const handleSavePersona = async () => {
    if (!currentUserId) return;
    try {
      // ✅ apiClient.put 사용 (axiosInstance.js에 put 추가 후 사용 가능)
      const response = await apiClient.put(`/api/v1/users/${currentUserId}/persona`, {
        decisionStyle, expertise, tone,
      });
      if (response.ok) {
        alert('✅ AI 어시스턴트의 성향이 완벽하게 업데이트되었습니다!');
      }
    } catch {
      alert('❌ 서버와 연결할 수 없습니다.');
    }
  };

  return {
    email,
    username,
    decisionStyle, setDecisionStyle,
    expertise, setExpertise,
    tone, setTone,
    stats,
    handleSavePersona,
  };
}
