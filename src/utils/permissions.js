export function isOwner(userInfo) {
  return userInfo?.role === 'owner';
}
