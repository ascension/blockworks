/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    largePageDataBytes: 300 * 100000,
  },
};

module.exports = nextConfig;
