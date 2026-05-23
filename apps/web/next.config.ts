import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@t1copilot/types', '@t1copilot/utils'],
  env: {
    DEXCOM_MCP_AUTH_TOKEN: process.env.DEXCOM_MCP_AUTH_TOKEN ?? '',
    DEXCOM_MCP_SERVER_URL: process.env.DEXCOM_MCP_SERVER_URL ?? 'https://dexcom-mcp-server.fly.dev',
    PELOTON_MCP_AUTH_TOKEN: process.env.PELOTON_MCP_AUTH_TOKEN ?? '',
    PELOTON_MCP_SERVER_URL:
      process.env.PELOTON_MCP_SERVER_URL ?? 'https://peloton-mcp-server.fly.dev',
  },
}

export default nextConfig
