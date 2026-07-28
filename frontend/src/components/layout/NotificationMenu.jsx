import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../../mocks/notifications';
import { ROUTES } from '../../routes/routeConfig';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
  </svg>
);

const NotificationMenu = () => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS.slice(0, 3));
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const openNotification = (notification) => {
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, unread: false } : item
    )));
    setIsOpen(false);
    navigate(notification.path);
  };

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        type="button"
        className="notification-trigger"
        aria-label={`알림 ${unreadCount}개`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <section className="notification-panel" aria-label="알림 목록">
          <header>
            <div><strong>알림</strong><span>새 알림 {unreadCount}개</span></div>
            {unreadCount > 0 && (
              <button type="button" onClick={() => setNotifications((current) => current.map((item) => ({ ...item, unread: false })))}>
                모두 읽음
              </button>
            )}
          </header>
          <div className="notification-list">
            {notifications.map((notification) => (
              <button type="button" key={notification.id} className={notification.unread ? 'unread' : ''} onClick={() => openNotification(notification)}>
                <span className="notification-status" aria-hidden="true" />
                <span className="notification-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.description}</span>
                  <time>{notification.time}</time>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="notification-footer" onClick={() => { setIsOpen(false); navigate(ROUTES.NOTIFICATIONS); }}>
            전체 업무 알림 보기
          </button>
        </section>
      )}
    </div>
  );
};

export default NotificationMenu;
