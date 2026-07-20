// Find your machine's LAN IP:
//   Windows → run `ipconfig`  → look for "IPv4 Address"
//   Mac/Linux → run `ifconfig` or `ip a` → look for "inet" under your Wi-Fi adapter
//
// Replace 192.168.X.X below with that IP.
// Your phone and PC must be on the same Wi-Fi network.
//
// NOTE: 10.0.2.2 only works on the Android emulator (it maps to localhost).
// For a real device or iOS simulator, you must use the LAN IP.

export const API_URL = __DEV__
  ? 'http://172.22.192.1:8000/api/v1'  
  : 'https://your-production-domain.com/api/v1';