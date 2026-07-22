const ErrorMessage = ({ message = '오류가 발생했습니다.' }) => {
  return <p role="alert">{message}</p>;
};

export default ErrorMessage;
