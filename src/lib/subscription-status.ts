export type SubscriptionStatus = 'active' | 'expiring' | 'none';

export function getSubscriptionStatus(fechaFin: string | null | undefined): SubscriptionStatus {
  if (!fechaFin) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${fechaFin}T00:00:00`);

  const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'none';
  if (diffDays <= 7) return 'expiring';
  return 'active';
}