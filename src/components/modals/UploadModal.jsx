export default function UploadModal({ selectedFile, setSelectedFile, isUploading, onUpload, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>지식망 파일 추가</h2>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#eee', fontWeight: 'bold' }}>
            취소
          </button>
          <button
            onClick={() => onUpload(onClose)}
            disabled={isUploading || !selectedFile}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', backgroundColor: '#000', color: '#fff', fontWeight: 'bold' }}
          >
            {isUploading ? '전송 중...' : '서버로 전송'}
          </button>
        </div>
      </div>
    </div>
  );
}
