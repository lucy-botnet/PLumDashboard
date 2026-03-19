/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/plum-escalation-dashboard',
  assetPrefix: '/plum-escalation-dashboard',
}

module.exports = nextConfig
