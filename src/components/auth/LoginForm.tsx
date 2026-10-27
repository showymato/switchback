"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logIn, type ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(logIn, initialState);
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
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-primary underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
