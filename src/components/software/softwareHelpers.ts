import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

export { getSimpleSoftwareName, getSimpleVersion };

export function formatLicenseLabel(licenseType?: string | null): { label: string; tone: 'free' | 'oss' | 'paid' } {
  const val = (licenseType || '').toLowerCase();
  if (val.includes('open') || val.includes('gpl') || val.includes('mit') || val.includes('apache') || val.includes('开源')) {
    return { label: '开源', tone: 'oss' };
  }
  if (val.includes('commercial') || val.includes('paid') || val.includes('收费') || val.includes('商业')) {
    return { label: '商业', tone: 'paid' };
  }
  return { label: '免费', tone: 'free' };
}

export function formatShortPlatform(platform?: string | null): string {
  if (!platform) return 'Windows';
  if (/mac/i.test(platform) && !/win/i.test(platform)) return 'macOS';
  if (/linux/i.test(platform) && !/win/i.test(platform)) return 'Linux';
  if (/arm64/i.test(platform)) return 'Win / ARM64';
  if (/windows/i.test(platform)) return 'Windows';
  return platform.slice(0, 14);
}

export function sanitizeChannelIconUrl(iconUrl?: string | null): string | undefined {
  if (!iconUrl) return undefined;
  if (iconUrl.includes('dicebear.com') || iconUrl.includes('google.com/chrome/static')) {
    return undefined;
  }
  return iconUrl;
}

export function formatShortDate(isoOrStr?: string | null): string {
  if (!isoOrStr) return '近期收录';
  return isoOrStr.slice(0, 10);
}
