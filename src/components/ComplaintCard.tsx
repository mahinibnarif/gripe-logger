import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ComplaintComments } from "./ComplaintComments";
import { ComplaintAttachments } from "./ComplaintAttachments";
import { EditComplaintDialog } from "./EditComplaintDialog";
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
    priority: string;
    resolution_note: string | null;
    created_at: string;
  };
  onDelete?: () => void;
}

export const ComplaintCard = ({ complaint, onDelete }: ComplaintCardProps) => {
  const status = complaint.status as "pending" | "in_progress" | "resolved";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetailsDialog(true)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{complaint.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={status} />
                <PriorityBadge priority={complaint.priority as "low" | "medium" | "high" | "urgent"} />
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
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <EditComplaintDialog complaint={complaint} onUpdate={onDelete || (() => {})} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Description</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
          </div>

          {complaint.resolution_note && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-1 text-status-resolved">Resolution Notes</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{complaint.resolution_note}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>Comments</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>Attachments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{complaint.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={status} />
                    <PriorityBadge priority={complaint.priority as "low" | "medium" | "high" | "urgent"} />
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
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{complaint.description}</p>
                </div>

                {complaint.resolution_note && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2 text-status-resolved">Resolution Notes</h4>
                    <p className="text-sm text-muted-foreground">{complaint.resolution_note}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <ComplaintAttachments 
                complaintId={complaint.id} 
                canUpload={status === "pending"}
              />
            </div>

            <div className="border-t pt-4">
              <ComplaintComments complaintId={complaint.id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
