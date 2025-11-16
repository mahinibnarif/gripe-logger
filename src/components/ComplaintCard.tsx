import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    status: string;
    resolution_note: string | null;
    created_at: string;
  };
  onDelete?: () => void;
}

export const ComplaintCard = ({ complaint, onDelete }: ComplaintCardProps) => {
  const status = complaint.status as "pending" | "in_progress" | "resolved";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", complaint.id);

    setIsDeleting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete complaint",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Complaint deleted successfully",
    });

    setShowDeleteDialog(false);
    onDelete?.();
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{complaint.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={status} />
                {complaint.category && (
                  <Badge variant="secondary" className="text-xs">
                    {complaint.category}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(complaint.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{complaint.description}</p>
          </div>

          {complaint.resolution_note && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-1 text-status-resolved">Resolution Notes</h4>
              <p className="text-sm text-muted-foreground">{complaint.resolution_note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your complaint. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
