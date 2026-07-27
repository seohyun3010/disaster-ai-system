import { useNavigate } from 'react-router-dom';

const StageNavigation = ({ previousPath, previousLabel, nextPath, nextLabel, nextDisabled = false, nextHint = '' }) => {
  const navigate = useNavigate();
  return <footer className="stage-navigation">
    {previousPath ? <button type="button" className="secondary-action" onClick={() => navigate(previousPath)}>← {previousLabel}</button> : <span />}
    {nextPath && <div className="stage-next-action"><button type="button" className="primary-action" disabled={nextDisabled} onClick={() => navigate(nextPath)}>{nextLabel} →</button>{nextDisabled && nextHint && <small>{nextHint}</small>}</div>}
  </footer>;
};

export default StageNavigation;
