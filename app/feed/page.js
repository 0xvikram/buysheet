import { redirect } from 'next/navigation'

// The old feed now lives in the workspace as Sample shops.
export default function Feed() {
  redirect('/app/explore')
}
