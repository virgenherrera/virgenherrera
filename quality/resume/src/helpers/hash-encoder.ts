export function encodePrivateHash(email: string, phone: string): string {
  const payload = JSON.stringify({ email, phone });

  return btoa(payload);
}
