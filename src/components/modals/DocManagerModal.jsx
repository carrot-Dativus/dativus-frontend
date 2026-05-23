export default function DocManagerModal({ docList, onDelete, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>📊 팀 지식망 현황</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '10px' }}>문서명</th>
              <th style={{ padding: '10px' }}>학습 상태</th>
              <th style={{ padding: '10px' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {docList.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>업로드된 지식이 없습니다.</td>
              </tr>
            ) : (
              docList.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontSize: '14px' }}>{doc.fileName}</td>
                  <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', color: doc.status === 'DONE' ? '#4caf50' : '#ff9800' }}>
                    {doc.status === 'DONE' ? '🟢 학습 완료' : '🟡 처리 중'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => onDelete(doc.id)} style={{ background: '#ff3b3b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      삭제
                    </button>
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
