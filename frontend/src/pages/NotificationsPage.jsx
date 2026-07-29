import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../mocks/notifications';

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '읽지 않음' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((item) => item.unread).length;
  const visibleNotifications = useMemo(
    () => notifications.filter((item) => filter === 'all' || item.unread),
    [filter, notifications],
  );

  const readAndOpen = (notification) => {
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, unread: false } : item
    )));
    navigate(notification.path);
  };

  return (
    <div className="case-page notifications-page">
      <header className="case-page-head">
        <div>
          <p>업무 알림</p>
          <h1>전체 알림</h1>
        </div>
      </header>

      <section className="notification-page-summary" aria-label="알림 요약">
        <article><span>전체 알림</span><strong>{notifications.length}<small>건</small></strong></article>
        <article><span>읽지 않은 알림</span><strong>{unreadCount}<small>건</small></strong></article>
      </section>

      <section className="case-card notification-page-card">
        <div className="notification-page-toolbar">
          <div className="notification-page-filters" aria-label="알림 필터">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item.value}
                className={filter === item.value ? 'active' : ''}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
                {item.value === 'unread' && <span>{unreadCount}</span>}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-read-all"
              onClick={() => setNotifications((current) => current.map((item) => ({ ...item, unread: false })))}
            >
              모두 읽음 처리
            </button>
          )}
        </div>

        <div className="notification-page-list">
          {visibleNotifications.map((notification) => (
            <article key={notification.id} className={notification.unread ? 'unread' : ''}>
              <span className="notification-page-dot" aria-hidden="true" />
              <button type="button" onClick={() => readAndOpen(notification)}>
                <span className="notification-page-meta">
                  <b>{notification.category}</b>
                  <time>{notification.time}</time>
                </span>
                <strong>{notification.title}</strong>
                <span className="notification-page-description">{notification.description}</span>
              </button>
              <button type="button" className="notification-page-open" onClick={() => readAndOpen(notification)}>
                업무 보기
              </button>
            </article>
          ))}
          {!visibleNotifications.length && (
            <div className="notification-page-empty">
              <span aria-hidden="true">✓</span>
              <strong>새로운 알림이 없습니다</strong>
              <p>확인하지 않은 업무 알림이 생기면 이곳에 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NotificationsPage;
