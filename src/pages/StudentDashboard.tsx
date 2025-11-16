import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ComplaintForm } from "@/components/ComplaintForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ["student-complaints", user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("complaints")
        .select("*")
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    await signOut();
    // Small delay to ensure auth state fully clears
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 100);
  };

  const handleComplaintSubmitted = () => {
    setIsFormOpen(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Gripe Logger</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{profile?.name}</span>
            </span>
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You’ll be signed out and redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">My Complaints</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ComplaintForm onSuccess={handleComplaintSubmitted} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : complaints && complaints.length > 0 ? (
              complaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} onDelete={refetch} />
              ))
            ) : (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No complaints found</h3>
                    <p className="text-muted-foreground">
                      {statusFilter === "all"
                        ? "You haven't submitted any complaints yet."
                        : `No ${statusFilter.replace("_", " ")} complaints.`}
                    </p>
                  </div>
                  {statusFilter === "all" && (
                    <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Your First Complaint
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
