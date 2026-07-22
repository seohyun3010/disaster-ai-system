import { Card, PageHead } from '../components/common/Workflow';

const CaseDetailPage = () => <>
  <PageHead stage={1} title="AI 피해조사 검토" description="신고 내역과 AI 분석 결과를 비교하여 담당자가 최종 검토합니다." badge="분석 완료" />
  <div className="alert-strip"><b>AI 검토 결과</b><strong>피해등급 불일치 · AI 신뢰도 68% · 피해면적 차이 12% · 추가 확인 권장</strong><span>현장 확인 권고</span></div>
  <div className="two-col">
    <Card title="피해 신고 내역" sub="신고자가 제출한 원본 신고 정보">
      <div className="info-grid"><span>신고번호<b>NDMS-0716-0048</b></span><span>신고자<b>김민수</b></span><span>시설유형<b>주택 / 반지하</b></span><span>신고일시<b>2026.07.16 09:42</b></span><span>위치<b>충북 청주시 흥덕구</b></span></div>
      <div className="damage-photo"><div className="building"><i/><i/><i/><i/></div><div className="water" /></div>
      <div className="description"><h3>신고 내용</h3><p>신고 피해등급 <b className="danger">전파</b></p><p>피해 설명 <b>주택 내부 침수 및 외부 담장 일부 파손</b></p></div>
    </Card>
    <Card title="AI 분석 결과" sub="YOLOv11-Seg, ConvNeXt V2, LLaVA 분석 결과">
      <div className="ai-summary"><div className="ai-image">normal 0.92</div><dl><dt>YOLO 결과</dt><dd>건물 객체 정상 검출</dd><dt>AI 신뢰도</dt><dd>92%</dd><dt>피해면적</dt><dd>명확한 피해 영역 없음</dd></dl></div>
      <div className="analysis-box"><h3>LLaVA 분석 근거</h3><ol><li>건물 외벽에서 균열과 붕괴 흔적이 확인되지 않습니다.</li><li>창문 및 외벽 마감재의 변형이 관찰되지 않습니다.</li><li>침수, 화재, 붕괴 등 명확한 피해 특징이 확인되지 않습니다.</li><li>현장 확인 후 최종 판단을 권장합니다.</li></ol></div>
      <div className="verdict"><div><b>신고내역 vs AI 비교</b><p>피해등급 <em>검토 필요</em></p><p>피해위치 <em>일치</em></p></div><div><b>종합 판단</b><p>최종 판정 <strong>정상 (Level 0)</strong></p><p>신뢰도 <strong>92%</strong></p></div></div>
    </Card>
  </div>
  <Card title="담당자 최종 판단" sub="AI 권고를 참고해 담당자가 최종 판단과 사유를 기록합니다." className="decision"><div><button>승인</button><button>보완 요청</button><button>현장 방문 요청</button></div><textarea placeholder="예: AI와 신고등급이 불일치하여 현장 확인 후 최종 판단 예정" /></Card>
</>;
export default CaseDetailPage;
