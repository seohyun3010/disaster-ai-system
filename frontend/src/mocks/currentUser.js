export const MOCK_CURRENT_USER = Object.freeze({
  id: 'officer-kim-minsu',
  name: '김민수',
  title: '주무관',
  department: '복구지원과',
  organization: '재난복구지원국',
  role: 'OFFICER',
});

export const getCurrentUser = () => MOCK_CURRENT_USER;

export const formatOfficerName = (user = MOCK_CURRENT_USER) => `${user.name} ${user.title}`;

export const formatOfficerAffiliation = (user = MOCK_CURRENT_USER) => {
  const profile = user.id === MOCK_CURRENT_USER.id ? MOCK_CURRENT_USER : user;
  return `${profile.organization} ${profile.department}`;
};

export const formatOfficerFull = (user = MOCK_CURRENT_USER) =>
  `${formatOfficerName(user)} · ${formatOfficerAffiliation(user)}`;

