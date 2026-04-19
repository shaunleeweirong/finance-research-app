'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const show = window.scrollY > 600;
      setVisible(show);
      document.body.classList.toggle('has-mobile-cta', show);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('has-mobile-cta');
    };
  }, []);

  return (
    <div className={`mk-mobile-cta${visible ? ' mk-visible' : ''}`}>
      <Link
        href="/sign-up"
        className="mk-btn mk-btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: 15 }}
      >
        Start free — no card <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
      </Link>
    </div>
  );
}
