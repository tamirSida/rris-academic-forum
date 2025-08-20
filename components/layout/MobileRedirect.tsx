'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const MobileRedirect: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if on mobile and on the root path
    const isMobile = window.innerWidth < 768;
    if (isMobile && pathname === '/') {
      router.replace('/contacts');
    }
  }, [pathname, router]);

  return null;
};

export default MobileRedirect;