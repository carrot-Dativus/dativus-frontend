import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#000000', '#4caf50', '#9c27b0'];

const statCardStyle = { flex: 1, backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const statLabelStyle = { fontSize: '13px', color: '#888', marginBottom: '15px', fontWeight: 'bold' };
const statValueStyle = { fontSize: '32px', fontWeight: '900', color: '#000' };
const chartBoxStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #dbdbdb', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const chartTitleStyle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' };

export default function QualityDashboard({ stats }) {
  const lineData = [
    { name: '5/10', score: 65 },
    { name: '5/11', score: 72 },
    { name: '5/12', score: 85 },
    { name: '5/13', score: 78 },
    { name: '5/14', score: 90 },
    { name: '오늘', score: stats.csatScore },
  ];

  const pieData = [
    { name: 'Dati (기본 커맨더)', value: 55 },
    { name: 'Groq (외부 탐색)', value: 30 },
    { name: 'Egos (특수 요원)', value: 15 },
  ];

  return (
    <div style={{ marginTop: '20px', borderTop: '3px solid #000', paddingTop: '40px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '30px', letterSpacing: '2px' }}>📈 AI 품질 관리 실시간 리포트</h2>

      {/* KPI 카드 */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>AI 응답 만족도 (CSAT)</div>
          <div style={{ ...statValueStyle, color: stats.csatScore >= 70 ? '#4caf50' : '#ff9800' }}>{stats.csatScore}%</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>총 대화 상호작용</div>
          <div style={statValueStyle}>{stats.totalInteractions}회</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>오답 자산화 수</div>
          <div style={{ ...statValueStyle, color: '#f44336' }}>{stats.failureLogs.length}건</div>
        </div>
      </div>

      {/* 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        <div style={chartBoxStyle}>
          <h4 style={chartTitleStyle}>📈 최근 만족도 변화 추이 (Quality Drift)</h4>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6, fill: '#4caf50' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px', textAlign: 'center' }}>* 프롬프트 개선 후 품질이 지속적으로 우상향하고 있습니다.</p>
        </div>

        <div style={chartBoxStyle}>
          <h4 style={chartTitleStyle}>🤖 에이전트별 작전 수행 비율</h4>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '13px', marginTop: '10px' }}>
            {pieData.map((d, i) => (
              <span key={i}><span style={{ color: COLORS[i], fontWeight: 'bold' }}>●</span> {d.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 오답 노트 */}
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', border: '1px solid #dbdbdb' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f44336', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🚨 집중 개선 필요 항목 (오답 노트)
        </h3>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
          * 사용자가 👎(싫어요)를 선택한 로그입니다. 프롬프트 개선의 핵심 자산으로 활용됩니다.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ padding: '15px', fontSize: '14px' }}>사용자 질문 (Query)</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>AI의 답변 (Failure Answer)</th>
              <th style={{ padding: '15px', fontSize: '14px', width: '120px' }}>기록 일시</th>
            </tr>
          </thead>
          <tbody>
            {stats.failureLogs.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '15px' }}>
                  현재까지 수집된 오답 데이터가 없습니다. 완벽한 지휘입니다! 😊
                </td>
              </tr>
            ) : (
              stats.failureLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontSize: '13px', fontWeight: '500' }}>{log.query}</td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{log.answer}</td>
                  <td style={{ padding: '15px', fontSize: '11px', color: '#aaa' }}>
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
