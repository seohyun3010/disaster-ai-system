import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import SupportCalculationCard from '../components/support/SupportCalculationCard';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { calculateSubsidy, confirmSubsidy, getSubsidy } from '../api/subsidyApi';
import { isDs2Grade, isZeroSupportGrade } from '../utils/reviewRules';

const createZeroSubsidy = (damageGrade, confirmed = false) => ({
  status: confirmed ? 'CONFIRMED' : 'CALCULATED',
  estimated_amount: 0,
  confirmed_amount: confirmed ? 0 : null,
  unit_price: 0,
  damage_ratio_percent: 0,
  damage_grade: damageGrade,
  calculation_standard: 'DS0·DS1 지원금 0원 적용',
  calculation_basis: '피해등급이 DS0 또는 DS1이므로 지원금은 0원으로 적용됩니다.',
});

const SupportPage = () => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const historyView = new URLSearchParams(search).get('view') === 'history';
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId]);
  const saveSupport = useWorkflowStore((state) => state.saveSupport);

  const reviewedDamageGrade = analysis?.reviewedGrade
    || workflow?.reviewedGrade
    || workflow?.confirmedGrade
    || workflow?.damageGrade
    || analysis?.result?.recommendedGrade;
  const isHeldGrade = isDs2Grade(reviewedDamageGrade);
  const hasZeroSupport = isZeroSupportGrade(reviewedDamageGrade);

  const [subsidy, setSubsidy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const runCalculate = useCallback(async () => {
    if (isHeldGrade || hasZeroSupport) return;
    setCalculating(true);
    setError('');
    setMessage('');
    try {
      const data = await calculateSubsidy(caseId);
      setSubsidy(data);
      setConfirmAmount(data.estimated_amount ?? '');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setCalculating(false);
    }
  }, [caseId, hasZeroSupport, isHeldGrade]);

  useEffect(() => {
    if (!caseId) return;
    if (isHeldGrade || hasZeroSupport) return;
    let ignore = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getSubsidy(caseId);
        if (ignore) return;
        setSubsidy(data);
        setConfirmAmount(data.confirmed_amount ?? data.estimated_amount ?? '');
      } catch (err) {
        if (ignore) return;
        if (err.response?.status === 404) {
          if (!historyView) await runCalculate();
        } else {
          setError(err.message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [caseId, hasZeroSupport, historyView, isHeldGrade, runCalculate]);

  // 예상 지원금과 최종 검토 금액이 다른 경우에만 "수정"으로 간주
  const isAmountChanged = () => {
    const estimated = Math.round(Number(subsidy?.estimated_amount ?? 0));
    const confirmed = Math.round(Number(confirmAmount || 0));
    return estimated !== confirmed;
  };

  const handleConfirm = async () => {
    if (isHeldGrade) return;
    if (hasZeroSupport) {
      setConfirming(true);
      setError('');
      saveSupport(caseId, 0, reason.trim());
      setMessage('지원금 0원이 확정되었습니다. 최종 확인 단계로 이동할 수 있습니다.');
      setConfirming(false);
      return;
    }
    if (isAmountChanged() && !reason.trim()) {
      setError('예상 지원금과 다른 금액으로 확정하려면 수정 사유를 입력해 주세요.');
      return;
    }
    setConfirming(true);
    setError('');
    try {
      const payload = {
        estimated_amount: subsidy?.estimated_amount ?? null,
        confirmed_amount: Number(confirmAmount),
        status: 'CONFIRMED',
      };
      const data = await confirmSubsidy(caseId, payload);
      setSubsidy(data);
      saveSupport(caseId, Number(data.confirmed_amount), reason.trim());
      setMessage('지원금이 확정되었습니다. 최종 확인 단계로 이동할 수 있습니다.');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (!item) {
    return (
      <div className="case-page">
        <section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section>
      </div>
    );
  }

  const displayedSubsidy = hasZeroSupport
    ? createZeroSubsidy(reviewedDamageGrade, workflow?.supportConfirmed)
    : isHeldGrade ? null : subsidy;
  const canProceed = !isHeldGrade && (hasZeroSupport
    ? Boolean(workflow?.supportConfirmed)
    : subsidy?.status === 'CONFIRMED');

  return (
    <div className="case-page">
      <CaseStageHeader item={item} breadcrumb="복구 심사 / 지원금 심사" title="지원금 심사" progressHistoryView={historyView} />
      <ReviewGuidance
        current="예상 지원금 산정 결과 검토"
        next="금액 반영 후 최종 확인"
        caution="산정 기준과 계산 과정이 일치하는지 확인해 주세요."
      />
      <section className="stage-two-column support-grid support-single">
        <SupportCalculationCard
          item={item}
          damageGrade={reviewedDamageGrade}
          subsidy={displayedSubsidy}
          loading={isHeldGrade || hasZeroSupport ? false : loading || calculating}
          calculating={calculating}
          confirming={confirming}
          confirmAmount={confirmAmount}
          onConfirmAmountChange={setConfirmAmount}
          reason={reason}
          onReasonChange={setReason}
          onCalculate={runCalculate}
          onConfirm={handleConfirm}
          error={error}
          message={message}
          hold={isHeldGrade}
          fixedZeroAmount={hasZeroSupport}
        />
      </section>
      <StageNavigation
        previousPath={`/cases/${caseId}/${isHeldGrade || hasZeroSupport ? 'analysis' : 'severity'}`}
        previousLabel={isHeldGrade || hasZeroSupport ? 'AI 분석' : '긴급도 검토'}
        nextPath={`/cases/${caseId}/final-approval`}
        nextLabel="최종 확인"
        nextDisabled={!canProceed}
        nextHint={isHeldGrade
          ? 'DS2 피해등급은 보류 대상이며 현장조사 재판정 흐름을 유지합니다.'
          : '지원금을 확정해야 최종 확인으로 이동할 수 있습니다.'}
      />
    </div>
  );
};

export default SupportPage;
