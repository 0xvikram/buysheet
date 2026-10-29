import { Shell } from '../../components/app/Shell.js'
import { WorkspaceProvider } from '../../components/app/Workspace.js'

export const metadata = { title: { default: 'Workspace', template: '%s · Restocked' } }

export default function AppLayout({ children }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  )
}
