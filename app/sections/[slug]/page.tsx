import { getSection } from '../../../components/SectionRegistry';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default function SectionPage(props: any) {
  const params = (props as any)?.params ?? {};
  const section = getSection(params.slug);
  if (!section) return notFound();
  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {section}
    </main>
  );
}


