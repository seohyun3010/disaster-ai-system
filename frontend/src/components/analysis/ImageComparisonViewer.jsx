import { useState } from 'react';

const DamageScene = ({ item }) => {
  const originalPhoto = item.photos?.[0] || (item.photoUrl ? { url: item.photoUrl } : null);
  return originalPhoto
    ? <img src={originalPhoto.url} alt={`${item.id} 원본 피해 사진`} />
    : <div className="analysis-placeholder"><div className="damage-sky" /><div className="damage-house"><i /><i /><i /></div><div className="damage-water" /></div>;
};

const ImageComparisonViewer = ({ item, result }) => {
  const [view, setView] = useState('original');
  const [showBoxes, setShowBoxes] = useState(true);
  const [showSegmentation, setShowSegmentation] = useState(true);
  const isResultView = view === 'result';
  const photoCount = item.photos?.length || (item.photoUrl ? 1 : 0);

  return <article className="case-card analysis-image-card">
    <div className="section-heading"><div><h2>피해 이미지 비교</h2><p>원본과 AI 분석 오버레이를 전환해 확인합니다.</p></div>{photoCount > 0 && <span className="photo-count">원본 {photoCount}장</span>}</div>
    <div className="image-view-tabs" role="tablist"><button type="button" className={!isResultView ? 'active' : ''} onClick={() => setView('original')}>원본 이미지</button><button type="button" className={isResultView ? 'active' : ''} onClick={() => setView('result')}>AI 분석 결과</button></div>
    <div className="analysis-image-frame"><DamageScene item={item} />{isResultView && showSegmentation && <div className="segmentation-overlay" style={{ clipPath: result.segmentation.clipPath }} />}{isResultView && showBoxes && result.boundingBoxes.map((box) => <span key={box.id} className="bounding-box" style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}><b>{box.label}</b></span>)}</div>
    <div className="overlay-controls"><label><input type="checkbox" checked={showBoxes} onChange={(event) => setShowBoxes(event.target.checked)} disabled={!isResultView} /> Bounding Box 표시</label><label><input type="checkbox" checked={showSegmentation} onChange={(event) => setShowSegmentation(event.target.checked)} disabled={!isResultView} /> Segmentation 표시</label></div>
  </article>;
};

export default ImageComparisonViewer;
