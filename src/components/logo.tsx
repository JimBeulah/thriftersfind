"use client";

import { useEffect, useState } from 'react'
import { Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className={cn("flex items-center gap-2 font-bold text-lg", className)} suppressHydrationWarning>
      {isMounted && <Boxes className="h-6 w-6 shrink-0 text-primary" />}
      <span className="group-data-[collapsible=icon]:hidden">ThriftersFind OMS</span>
    </div>
  )
}
