import { redirect } from 'next/navigation';

// The app's web edition served the front page at both / and /read. The new
// site serves it at /. This alias keeps any older shared /read links working
// by sending them to the front page rather than 404ing.
export const dynamic = 'force-dynamic';

export function GET() {
  redirect('/');
}
