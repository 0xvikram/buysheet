'use client'

import AgentThread from '../../../components/app/AgentThread.js'
import { Topbar } from '../../../components/app/Shell.js'

export default function Agent() {
  return (
    <>
      <Topbar crumbs={[{ label: 'Agent' }]} />
      <AgentThread full />
    </>
  )
}
