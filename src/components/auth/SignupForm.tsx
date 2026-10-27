"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpCustomer, type ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpCustomer, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (state?.ok) {
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/account");
      router.refresh();
    }
  }, [state, router, searchParams]);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
        {state && !state.ok && state.fieldErrors?.fullName && <p className="text-xs text-destructive">{state.fieldErrors.fullName}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state && !state.ok && state.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
        {state && !state.ok && state.fieldErrors?.phone && <p className="text-xs text-destructive">{state.fieldErrors.phone}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        {state && !state.ok && state.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
