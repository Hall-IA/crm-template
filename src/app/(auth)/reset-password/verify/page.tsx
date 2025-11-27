"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyResetCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/reset-password");
    }
  }, [email, router]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Seulement des chiffres

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Prendre seulement le dernier caractère
    setCode(newCode);

    // Passer au champ suivant automatiquement
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
      setCode(newCode.slice(0, 6));
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      const nextInput = document.getElementById(`code-${lastFilledIndex}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const codeString = code.join("");
    if (codeString.length !== 6) {
      setError("Veuillez entrer le code complet à 6 chiffres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Code invalide");
      }

      // Rediriger vers la page de définition du nouveau mot de passe
      router.push(`/reset-password/complete?token=${data.token}`);
    } catch (err: any) {
      setError(err.message || "Code invalide");
      setCode(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("code-0") as HTMLInputElement;
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Vérifier le code</h1>
            <p className="mt-2 text-sm text-gray-600">
              Entrez le code à 6 chiffres envoyé à
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 w-14 rounded-lg border-2 border-gray-300 text-center text-2xl font-bold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Vérifier le code"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                try {
                  await fetch("/api/reset-password/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  setError("");
                } catch (err) {
                  // Ignorer les erreurs silencieusement
                }
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Renvoyer le code
            </button>
          </div>

          <Link
            href="/signin"
            className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-700"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

