export default function CanvasArea({ isCanvasOpen, setIsCanvasOpen, canvasData }) {
  return (
    <div className="canvas-cell" style={{
      width: isCanvasOpen ? '50%' : '0%',
      opacity: isCanvasOpen ? 1 : 0,
      transition: 'all 0.5s ease-in-out',
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* 캔버스 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 30px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', minWidth: '300px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
          {canvasData ? `📊 ${canvasData.title || '데이터 대시보드'}` : '🎨 Dativus 캔버스'}
        </div>
        <button onClick={() => setIsCanvasOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✖</button>
      </div>
      
      {/* 캔버스 내용 */}
      <div style={{ 
        flex: 1, 
        padding: '30px', 
        overflowY: 'auto', 
        overflowX: 'hidden', 
        wordBreak: 'break-word',
        backgroundColor: '#f9fafb', 
        minWidth: '300px' 
      }}>
        {!canvasData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>✨</div>
            <p style={{ color: '#333', fontSize: '18px', fontWeight: 'bold' }}>데이터 시각화 대기 중...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: '#666', marginBottom: '10px' }}>{canvasData.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {canvasData.items && canvasData.items.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ backgroundColor: '#000', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{item.option}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4caf50', marginBottom: '8px' }}><strong>장점:</strong> {item.pros}</div>
                  <div style={{ fontSize: '13px', color: '#f44336' }}><strong>단점:</strong> {item.cons}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}