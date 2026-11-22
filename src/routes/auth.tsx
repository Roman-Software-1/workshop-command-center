import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { ArrowLeft, LogOut, Save, UserRound } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/account/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileInput } from "@/lib/profile";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Workshop Panel — Sign in & profile" },
    { name: "description", content: "Sign into your workshop account and manage your private profile." },
    { property: "og:title", content: "Workshop Panel — Sign in & profile" },
    { property: "og:description", content: "Your private workshop account and profile." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AccountPage,
});

function GoogleMark() {
  return <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;
}

function AccountPage() {
  const { user, loading } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const profile = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Sign in first.");
      const { data, error } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (profile.data) { setName(profile.data.display_name); setAvatar(profile.data.avatar_url); }
  }, [profile.data]);
  async function signIn(provider: "google" | "lovable") {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed. Try again."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setError(""); setMessage("");
    const parsed = profileInput.safeParse({ display_name: name, avatar_url: avatar });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your profile."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from("profiles").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", user.id).select("id").single();
      if (error || !data) throw error ?? new Error("Profile was not saved.");
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      setMessage("Profile saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your profile."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError("");
    try {
      await queryClient.cancelQueries(); queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/auth", replace: true });
      setMessage(""); setName(""); setAvatar("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not sign out."); }
    finally { setBusy(false); }
  }
  return <main className="dark min-h-screen bg-background px-6 py-6 font-sans text-foreground">
    <div className="mx-auto max-w-md">
      <Button asChild variant="ghost" className="mb-5"><Link to="/a"><ArrowLeft />Workshop</Link></Button>
      <div className="mb-5 border-b border-border pb-5">
        <p className="mb-2 font-mono text-xs uppercase text-status-in">Workshop Panel</p>
        <h1 className="font-display text-3xl">{user ? "Your profile" : "Sign in"}</h1>
      </div>
      {loading ? <p role="status">Loading account…</p> : !user ? <div className="grid gap-3">
        <Button disabled={busy} variant="outline" className="google-sign-in h-12" onClick={() => void signIn("google")}><GoogleMark />Continue with Google</Button>
        <Button disabled={busy} variant="outline" className="h-12" onClick={() => void signIn("lovable")}><LovableMark className="size-[18px]" />Continue with Lovable</Button>
      </div> : profile.isPending ? <p role="status">Loading profile…</p> : profile.isError ? <div><p role="alert">Could not load your profile.</p><Button variant="outline" onClick={() => void profile.refetch()}>Try again</Button><Button variant="ghost" disabled={busy} onClick={() => void signOut()}>Sign out</Button></div> : <form onSubmit={(e) => void save(e)} className="space-y-4">
        <div className="flex items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{profile.data?.avatar_url && profileInput.shape.avatar_url.safeParse(profile.data.avatar_url).success ? <img src={profile.data.avatar_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : <UserRound />}</div><p className="min-w-0 break-all text-sm text-muted-foreground">{user.email}</p></div>
        <div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="h-11" /></div>
        <div className="space-y-2"><Label htmlFor="avatar-url">Avatar image URL</Label><Input id="avatar-url" type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://" className="h-11" /></div>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy} className="h-11"><Save />{busy ? "Saving…" : "Save profile"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void signOut()} className="h-11"><LogOut />Sign out</Button></div>
      </form>}
      {error && <p role="alert" className="mt-4 text-sm text-status-out">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm text-status-in">{message}</p>}
    </div>
  </main>;
}