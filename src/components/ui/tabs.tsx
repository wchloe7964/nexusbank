'use client'

import { useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils/cn'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

export function Tabs({ defaultValue, children, className }: {
  defaultValue: string
  children: React.ReactNode
  className?: string
}) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'inline-flex h-11 items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
      className
    )}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { activeTab, setActiveTab } = useTabs()
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
        activeTab === value
          ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          : 'hover:text-foreground hover:bg-card/50',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { activeTab } = useTabs()
  if (activeTab !== value) return null
  return <div className={cn('mt-4 animate-in', className)}>{children}</div>
}
