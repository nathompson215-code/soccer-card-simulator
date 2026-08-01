import type { NextConfig } from "next";

/**
 * Next.js 16.2+ blocks cross-origin access to `/_next/*` (scripts, CSS, HMR)
 * unless the browser host is allowlisted. Cursor Browser, LAN IPs, and cloud
 * port-forwards otherwise get 403s on those assets — which leaves a blank
 * white page that never finishes hydrating when the HMR debug channel hangs.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "*.localhost",
    // Any IPv4 host (containers, cloud VMs, LAN)
    "*.*.*.*",
    // Embedded / remote IDE browsers
    "vscode-webview",
    "*.vscode-webview",
    "cursor.com",
    "*.cursor.com",
    "*.cursor.sh",
    "*.cursorservice.site",
  ],
};

export default nextConfig;
