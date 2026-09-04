export const ALLOWED_IP_ENDPOINTS = {
  BASE: '/allowed-ips',
  BY_ID: (id: string) => `/allowed-ips/${id}`,
  FILTER_MODE: '/allowed-ips/filter-mode',
  MY_IP: '/allowed-ips/my-ip',
} as const;
