import type { WatchAvailability, WatchProvider } from '@/app/definitions';

function platformName(name: string) {
  const normalized = name.normalize('NFKC').toLowerCase().replace(/\+/g, ' plus ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    .replace(/\s+(?:(?:basic|standard)\s+)?with ads$/, '')
    .replace(/\s+(?:amazon|apple tv|roku(?: premium)?) channels?$/, '');
  return normalized === 'amazon prime video' ? 'prime video' : normalized === 'hbo max' ? 'max' : normalized;
}

export function getStreamingPlatforms(regions: Record<string, WatchAvailability>): WatchProvider[] {
  const candidates = Object.values(regions).flatMap((availability) => [
    ...(availability.flatrate ?? []), ...(availability.free ?? []), ...(availability.ads ?? [])
  ]).sort((first, second) => {
    // Prefer a usable logo and the main service rather than its channel/ad plan.
    const logoPreference = Number(Boolean(second.logo_path)) - Number(Boolean(first.logo_path));
    const variantPreference = Number(/\b(channel|channels|with ads)\b/i.test(first.provider_name)) - Number(/\b(channel|channels|with ads)\b/i.test(second.provider_name));
    return logoPreference || variantPreference || first.provider_id - second.provider_id;
  });
  const ids = new Set<number>();
  const names = new Set<string>();
  const logos = new Set<string>();
  const platforms: WatchProvider[] = [];
  for (const provider of candidates) {
    const name = platformName(provider.provider_name);
    const logo = provider.logo_path?.trim();
    const duplicate = ids.has(provider.provider_id) || (name && names.has(name)) || (logo && logos.has(logo));
    // Remember every alias, including aliases of an already-grouped entry.
    ids.add(provider.provider_id);
    if (name) names.add(name);
    if (logo) logos.add(logo);
    if (!duplicate) platforms.push(provider);
  }
  return platforms.sort((first, second) => first.provider_name.localeCompare(second.provider_name));
}
