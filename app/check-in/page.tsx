"use client"
import dynamic from 'next/dynamic';

// Dynamically import the component with SSR disabled
const CheckInPageClient = dynamic(() => import('@/components/CheckInPage'), { 
  ssr: false 
});

export default function CheckInPage() {
  return <CheckInPageClient />;
}