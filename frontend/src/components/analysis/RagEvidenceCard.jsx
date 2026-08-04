import { useEffect, useState } from 'react';
import { searchPolicyDocuments } from '../../api/ragApi';
import { MOCK_ANALYSIS_EVIDENCE } from '../../mocks/ragEvidence';
import { EvidencePanel } from '../persona/ReviewGuidance';
import './rag-evidence.css';

const RAG_NOT_CONNECTED_MESSAGE = 'RAG API is not connected yet.';

const getDocuments = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.documents)) return response.documents;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const RagEvidenceCard = ({ caseId, damageGrade }) => {
  const [status, setStatus] = useState('loading');
  const [documents, setDocuments] = useState([]);
  const [usesMockData, setUsesMockData] = useState(false);

  useEffect(() => {
    let active = true;

    const loadEvidence = async () => {
      try {
        const response = await searchPolicyDocuments({ caseId, damageGrade });
        if (!active) return;
        setDocuments(getDocuments(response));
        setUsesMockData(false);
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        const apiNotConnected = error?.message === RAG_NOT_CONNECTED_MESSAGE;
        if (apiNotConnected && import.meta.env.DEV) {
          setDocuments(MOCK_ANALYSIS_EVIDENCE);
          setUsesMockData(true);
          setStatus('ready');
          return;
        }
        if (apiNotConnected) {
          setDocuments([]);
          setStatus('ready');
          return;
        }
        setStatus('error');
      }
    };

    loadEvidence();
    return () => { active = false; };
  }, [caseId, damageGrade]);

  return (
    <EvidencePanel
      title="근거 문서·관련 조항 확인"
      className="analysis-rag-evidence"
      data-evidence-source={usesMockData ? 'mock' : 'api'}
    >
      {status === 'loading' && (
        <p className="rag-evidence-state" role="status">관련 근거를 검색하고 있습니다.</p>
      )}
      {status === 'error' && (
        <p className="rag-evidence-state is-error" role="alert">근거 문서를 불러오지 못했습니다.</p>
      )}
      {status === 'ready' && documents.length === 0 && (
        <p className="rag-evidence-state">현재 판정과 관련된 근거 문서를 찾지 못했습니다.</p>
      )}
      {status === 'ready' && documents.length > 0 && (
        <div className="rag-evidence-list">
          {documents.map((document, index) => {
            const sourceDetails = [document.source, document.article, document.page]
              .filter(Boolean)
              .join(' · ');
            return (
              <article key={`${document.title}-${sourceDetails}-${index}`}>
                <h3>{document.title}</h3>
                <p>{document.summary}</p>
                <footer>
                  <span>출처</span>
                  <strong>{sourceDetails || '원문 위치 정보 없음'}</strong>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </EvidencePanel>
  );
};

export default RagEvidenceCard;
