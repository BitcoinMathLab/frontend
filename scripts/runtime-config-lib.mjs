const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function normalizeApiBaseUrl(rawValue) {
  const value = rawValue.trim();
  if (!value) return '';

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('BML_API_BASE_URL must be an absolute HTTP or HTTPS URL.');
  }

  const isHttps = parsed.protocol === 'https:';
  const isLoopbackHttp = parsed.protocol === 'http:' && LOOPBACK_HOSTS.has(parsed.hostname);
  if (!isHttps && !isLoopbackHttp) {
    throw new Error('BML_API_BASE_URL must use HTTPS unless it targets a loopback address.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('BML_API_BASE_URL must not contain credentials.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('BML_API_BASE_URL must not contain a query string or fragment.');
  }

  const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${path}`;
}

export function addApiOriginToHeaders(template, apiBaseUrl) {
  if (!apiBaseUrl) return template;

  const origin = new URL(apiBaseUrl).origin;
  const connectSource = /connect-src ([^;\n]+)/;
  const match = connectSource.exec(template);
  if (!match) {
    throw new Error('The headers template must define a connect-src Content Security Policy.');
  }

  const sources = match[1].trim().split(/\s+/);
  if (sources.includes(origin)) return template;
  sources.splice(1, 0, origin);
  return template.replace(connectSource, `connect-src ${sources.join(' ')}`);
}
