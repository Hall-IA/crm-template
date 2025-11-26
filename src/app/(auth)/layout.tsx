export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-lienar-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}

