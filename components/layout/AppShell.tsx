import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[#f6f6f8] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
