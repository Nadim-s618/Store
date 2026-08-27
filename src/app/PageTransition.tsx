'use client'

import { usePathname, useSearchParams } from 'next/navigation'

export default function PageTransition({ children, className }: { children: React.ReactNode; className: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams.toString()}`

  return <div key={routeKey} className={className}>{children}</div>
}
