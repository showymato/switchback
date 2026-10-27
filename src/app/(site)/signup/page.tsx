import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl text-foreground">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Book vehicles and manage reservations in Manali.</p>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
