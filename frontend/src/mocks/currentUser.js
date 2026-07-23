export const MOCK_CURRENT_USER = Object.freeze({
  id: 'officer-kim-minsu',
  name: '김민수',
  title: '주무관',
  department: '안전총괄과',
  organization: 'OO시청',
  role: 'OFFICER',
});

export const getCurrentUser = () => MOCK_CURRENT_USER;

export const formatOfficerName = (user = MOCK_CURRENT_USER) => `${user.name} ${user.title}`;

export const formatOfficerAffiliation = (user = MOCK_CURRENT_USER) => `${user.organization} ${user.department}`;

export const formatOfficerFull = (user = MOCK_CURRENT_USER) =>
  `${formatOfficerName(user)} · ${formatOfficerAffiliation(user)}`;

