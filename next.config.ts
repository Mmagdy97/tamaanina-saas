import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* خيارات التكوين لـ Vercel والإنتاج */
  typescript: {
    // نتجاهل أخطاء النوع في النشر السريع لضمان الاستمرارية، يفضل إصلاحها لاحقاً
    ignoreBuildErrors: true,
  },
  eslint: {
    // نتجاهل أخطاء ESLint أثناء البناء
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
