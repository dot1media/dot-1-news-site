import { redirect } from 'next/navigation';

// Short share link for videos (news.dot1.media/v/<id>), the form the editorial portal hands out.
// It forwards to the full video page so every link anyone has already shared keeps working.
export default function VideoShortLink({ params }: { params: { id: string } }) {
  redirect(`/s/v/${encodeURIComponent(params.id)}`);
}
