import { respond } from '../../../lib/agent.js'
import { allow, tooMany } from '../../../lib/limit.js'
import { QlooError } from '../../../lib/qloo.js'

export const maxDuration = 60

export async function POST(request) {
  if (!allow(request)) return tooMany()
  const body = await request.json().catch(() => ({}))
  const message = typeof body.message === 'string' ? body.message.slice(0, 4000) : ''
  const state = body.state && typeof body.state === 'object' ? body.state : {}
  const trace = []
  try {
    return Response.json({ ...(await respond(message, state, trace)), trace })
  } catch (e) {
    const known = e instanceof QlooError
    return Response.json(
      { error: known ? e.message : 'Something went wrong. Your shop details are kept; try again.', state, trace },
      { status: known ? 502 : 500 },
    )
  }
}
