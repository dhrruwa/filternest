/**
 * Parses user agent strings to extract OS, Browser, and Device type.
 * Written with high efficiency to eliminate external package dependencies in hot code paths.
 */
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      deviceType: 'desktop',
      deviceName: 'Unknown Device',
    };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'desktop';

  const ua = userAgentString.toLowerCase();

  // 1. Detect OS
  if (ua.includes('windows nt')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x') || ua.includes('mac_powerpc')) {
    os = 'macOS';
  } else if (ua.includes('android')) {
    os = 'Android';
    deviceType = 'mobile';
  } else if (ua.includes('iphone') || ua.includes('ipod')) {
    os = 'iOS';
    deviceType = 'mobile';
  } else if (ua.includes('ipad')) {
    os = 'iOS';
    deviceType = 'tablet';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('x11')) {
    os = 'Unix';
  }

  // 2. Detect Browser
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('chrome') || ua.includes('crios')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox') || ua.includes('fxios')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('android')) {
    browser = 'Safari';
  }

  // 3. Fallbacks and refinements
  if ((ua.includes('mobi') || ua.includes('mini') || ua.includes('phone')) && deviceType === 'desktop') {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('playbook')) {
    deviceType = 'tablet';
  }

  return {
    browser,
    os,
    deviceType,
    deviceName: `${browser} on ${os}`,
  };
};

module.exports = { parseUserAgent };
