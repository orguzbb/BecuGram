export function validateUsername(rawUsername: string): { isValid: boolean; error?: string } {
  const clean = (rawUsername || '').trim().toLowerCase().replace(/^@/, '');

  if (!clean || clean.length < 5) {
    return { isValid: false, error: "Foydalanuvchi nomi kamida 5 ta belgidan iborat bo'lishi kerak." };
  }
  if (clean.length > 30) {
    return { isValid: false, error: "Foydalanuvchi nomi ko'pi bilan 30 ta belgidan iborat bo'lishi kerak." };
  }
  if (clean.startsWith('_')) {
    return { isValid: false, error: "Foydalanuvchi nomi '_' (pastki chiziq) bilan boshlanishi mumkin emas." };
  }
  if (clean.endsWith('_')) {
    return { isValid: false, error: "Foydalanuvchi nomi '_' (pastki chiziq) bilan tugashi mumkin emas." };
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    return { isValid: false, error: "Faqat kichik lotin harflari (a-z), raqamlar (0-9) va '_' ruxsat etiladi." };
  }
  if (!/^[a-z0-9]/.test(clean) || !/[a-z0-9]$/.test(clean)) {
    return { isValid: false, error: "Foydalanuvchi nomi harf yoki raqam bilan boshlanishi va tugashi kerak." };
  }

  return { isValid: true };
}

