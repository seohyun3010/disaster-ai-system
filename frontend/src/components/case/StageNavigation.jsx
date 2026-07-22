import { useNavigate } from 'react-router-dom';

const StageNavigation = ({ previousPath, previousLabel, nextPath, nextLabel }) => {
  const navigate = useNavigate();
  return <footer className="stage-navigation">
    {previousPath ? <button type="button" className="secondary-action" onClick={() => navigate(previousPath)}>← {previousLabel}</button> : <span />}
    {nextPath && <button type="button" className="primary-action" onClick={() => navigate(nextPath)}>{nextLabel} →</button>}
  </footer>;
};

export default StageNavigation;
