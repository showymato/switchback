import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl text-foreground">Log in to Switchback</h1>
      <p className="mt-1 text-sm text-muted-foreground">Access your bookings, or your partner/admin dashboard.</p>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
