/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the test suite build into a separate directory so it doesn't
  // clobber the .next cache of a developer's own `npm run dev` session.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async redirects() {
    // Old static-site URLs from before the Next.js migration.
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/history.html', destination: '/history', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/expense.html', destination: '/expense', permanent: true },
      { source: '/pin.html', destination: '/pin', permanent: true },
    ];
  },
};

module.exports = nextConfig;
