"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (session) {
      // Utilisateur connecté -> rediriger vers le dashboard
      router.push("/dashboard");
    } else {
      // Utilisateur non connecté -> rediriger vers la page de connexion
      router.push("/signin");
    }
  }, [session, isPending, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
        <p className="text-sm text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}

