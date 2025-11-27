import Header from '@/components/header';

export default function DirectoryLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}
