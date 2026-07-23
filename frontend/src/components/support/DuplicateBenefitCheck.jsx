import { EvidencePanel, TermHelp } from '../persona/ReviewGuidance';

const DuplicateBenefitCheck = ({ duplicate, result }) => <article className="case-card duplicate-check-card">
  <div className="section-heading"><div><h2>중복 수혜 검증</h2><p>동일 신청인과 주소를 기준으로 확인한 Mock 결과입니다.</p></div></div>
  <span className={duplicate ? 'duplicate-badge' : 'analysis-state-badge completed'}>{duplicate ? '중복 수혜 의심' : '중복 수혜 이상 없음'}</span>
  <p>{result}</p>
  <EvidencePanel title="검사 기준 확인"><p><TermHelp label="중복 수혜">동일 피해에 대해 다른 제도에서 이미 지원을 받았는지 확인하는 절차입니다.</TermHelp></p><p><b>대조 항목:</b> 신청인 식별정보, 피해 주소, 재난 발생일, 기존 지급 이력</p><p><b>판정:</b> {duplicate ? '유사 이력이 있어 원문 대조 및 담당자 확인이 필요합니다.' : '현재 Mock 데이터에서 일치하는 지급 이력이 없습니다.'}</p></EvidencePanel>
</article>;

export default DuplicateBenefitCheck;
