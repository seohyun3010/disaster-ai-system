/*
 * Mock 데이터 비활성화(2026-07-29)
 * 실제 로그인 사용자 API 연동 전 원본 보존을 위해 삭제하지 않고 주석 처리합니다.
 *
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
*/

export const MOCK_CURRENT_USER = Object.freeze({
  id: null,
  name: '',
  title: '',
  department: '',
  organization: '',
  role: '',
});
export const getCurrentUser = () => MOCK_CURRENT_USER;
export const formatOfficerName = (user = MOCK_CURRENT_USER) =>
  [user.name, user.title].filter(Boolean).join(' ');
export const formatOfficerAffiliation = (user = MOCK_CURRENT_USER) =>
  [user.organization, user.department].filter(Boolean).join(' ');
export const formatOfficerFull = (user = MOCK_CURRENT_USER) =>
  [formatOfficerName(user), formatOfficerAffiliation(user)].filter(Boolean).join(' · ');

