const DuplicateBenefitCheck = ({ duplicate, result }) => <article className="case-card duplicate-check-card">
  <div className="section-heading"><div><h2>중복 수혜 검증</h2><p>동일 신청인과 주소를 기준으로 확인한 Mock 결과입니다.</p></div></div>
  <span className={duplicate ? 'duplicate-badge' : 'analysis-state-badge completed'}>{duplicate ? '중복 수혜 의심' : '중복 수혜 이상 없음'}</span>
  <p>{result}</p>
</article>;

export default DuplicateBenefitCheck;
