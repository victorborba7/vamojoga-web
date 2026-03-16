import { redirect } from "next/navigation";

interface LegacyCollectionDetailPageProps {
  params: {
    id: string;
  };
}

export default function LegacyCollectionDetailPage({
  params,
}: LegacyCollectionDetailPageProps) {
  redirect(`/collections/${params.id}`);
}
