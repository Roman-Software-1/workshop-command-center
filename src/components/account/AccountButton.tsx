import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "./AuthProvider";

export function AccountButton() {
  const { user, loading } = useAccount();
  return <Button asChild variant="ghost" size="sm" className="h-7 max-w-[150px] text-xs">
    <Link to="/auth"><UserRound /><span className="truncate">{loading ? "Account" : user ? "My profile" : "Sign in"}</span></Link>
  </Button>;
}