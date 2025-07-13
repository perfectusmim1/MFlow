export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // OS detection
  let os = 'Unknown';
  let platform = 'Unknown';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  
  if (ua.includes('windows')) {
    os = 'Windows';
    platform = 'Windows';
  } else if (ua.includes('mac os')) {
    os = 'macOS';
    platform = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
    platform = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    platform = 'Android';
    deviceType = ua.includes('mobile') ? 'mobile' : 'tablet';
  } else if (ua.includes('iphone')) {
    os = 'iOS';
    platform = 'iPhone';
    deviceType = 'mobile';
  } else if (ua.includes('ipad')) {
    os = 'iOS';
    platform = 'iPad';
    deviceType = 'tablet';
  }

  // Device name generation
  let deviceName = '';
  if (deviceType === 'mobile') {
    if (platform === 'iPhone') {
      deviceName = 'iPhone';
    } else if (platform === 'Android') {
      deviceName = 'Android Telefon';
    } else {
      deviceName = 'Mobil Cihaz';
    }
  } else if (deviceType === 'tablet') {
    if (platform === 'iPad') {
      deviceName = 'iPad';
    } else if (platform === 'Android') {
      deviceName = 'Android Tablet';
    } else {
      deviceName = 'Tablet';
    }
  } else {
    if (platform === 'Windows') {
      deviceName = 'Windows Bilgisayar';
    } else if (platform === 'macOS') {
      deviceName = 'Mac';
    } else if (platform === 'Linux') {
      deviceName = 'Linux Bilgisayar';
    } else {
      deviceName = 'Masaüstü Bilgisayar';
    }
  }

  return {
    userAgent,
    platform,
    browser,
    os,
    deviceType,
    deviceName
  };
}

export function getClientIP(req: Request): string {
  // Vercel, Netlify gibi platformlarda gerçek IP'yi almak için
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1'; // Fallback
}