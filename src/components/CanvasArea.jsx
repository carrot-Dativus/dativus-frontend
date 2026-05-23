import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const DEFAULT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function PieChartCard({ chart }) {
  const data = chart.data.map((d, i) => ({
    ...d,
    color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>{chart.title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="42%"
            innerRadius={48}
            outerRadius={78}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v, name) => [v, name]} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChartCard({ chart }) {
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>{chart.title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chart.data.map((_, i) => <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgressCard({ chart }) {
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>{chart.title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
        {chart.data.map((item, i) => {
          const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const pct = Math.min(Math.max(Number(item.value) || 0, 0), 100);
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#555' }}>{item.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color }}>{pct}%</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScorecardCard({ chart }) {
  return (
    <div style={styles.chartCard}>
      <p style={styles.chartTitle}>{chart.title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '8px' }}>
        {chart.data.map((item, i) => (
          <div key={i} style={{ background: '#f8f9ff', borderRadius: '10px', padding: '14px 10px', textAlign: 'center', border: `1px solid ${DEFAULT_COLORS[i % DEFAULT_COLORS.length]}30` }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderChart(chart) {
  switch (chart.chartType) {
    case 'pie':       return <PieChartCard key={chart.id} chart={chart} />;
    case 'bar':       return <BarChartCard key={chart.id} chart={chart} />;
    case 'progress':  return <ProgressCard key={chart.id} chart={chart} />;
    case 'scorecard': return <ScorecardCard key={chart.id} chart={chart} />;
    default:          return null;
  }
}

export default function CanvasArea({ isCanvasOpen, setIsCanvasOpen, canvasData, onReset }) {
  const [localData, setLocalData] = useState(canvasData);

  useEffect(() => {
    setLocalData(canvasData);
  }, [canvasData]);

  const handleReset = () => {
    setLocalData(null);
    onReset();
  };

  return (
    <div style={{
      width: isCanvasOpen ? '45%' : '0%',
      opacity: isCanvasOpen ? 1 : 0,
      transition: 'all 0.4s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      borderLeft: '1px solid #eee',
    }}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          {localData ? `📊 ${localData.title || '데이터 대시보드'}` : '🎨 Dativus 캔버스'}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {localData && (
            <button
              onClick={handleReset}
              style={{ fontSize: '11px', padding: '4px 10px', background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              캔버스 초기화
            </button>
          )}
          <button onClick={() => setIsCanvasOpen(false)} style={styles.closeBtn}>✖</button>
        </div>
      </div>

      <div style={styles.body}>
        {!localData ? (
          <div style={styles.empty}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>✨</div>
            <p style={{ color: '#555', fontSize: '16px', fontWeight: 'bold' }}>AI와 대화하면 대시보드가 자동 생성됩니다</p>
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '8px' }}>목표 설정, 기술 비교, 계획 수립 등을 물어보세요</p>
          </div>
        ) : (
          <div>
            {localData.description && (
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
                {localData.description}
              </p>
            )}
            {(localData.charts || []).map(chart => renderChart(chart))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa',
    minWidth: '300px',
  },
  headerTitle: { fontSize: '15px', fontWeight: 'bold', color: '#111' },
  closeBtn: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#999' },
  body: { flex: 1, padding: '20px 24px', overflowY: 'auto', backgroundColor: '#f9fafb', minWidth: '300px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' },
  chartCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '18px 16px',
    marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
  },
  chartTitle: { fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '4px' },
};
