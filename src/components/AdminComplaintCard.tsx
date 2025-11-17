import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Settings, UserCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AdminComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    status: string;
    resolution_note: string | null;
    created_at: string;
    assigned_to: string | null;
    profiles: { name: string; email: string } | null;
    assigned_admin?: { name: string; email: string } | null;
  };
  onUpdate: () => void;
}

export const AdminComplaintCard = ({ complaint, onUpdate }: AdminComplaintCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(complaint.status);
  const displayStatus = complaint.status as "pending" | "in_progress" | "resolved";
  const [resolutionNote, setResolutionNote] = useState(complaint.resolution_note || "");
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: adminUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (error) throw error;

      // Fetch profiles for admin users
      const userIds = data.map(r => r.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      if (profileError) throw profileError;
      return profiles;
    },
  });

  const handleUpdate = async () => {
    setIsLoading(true);

    const { error } = await supabase
      .from("complaints")
      .update({
        status,
        resolution_note: resolutionNote || null,
        assigned_to: assignedTo || null,
      })
      .eq("id", complaint.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Complaint updated successfully",
    });

    setIsOpen(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">
                {complaint.profiles?.name || "Unknown Student"}
              </span>
              <span className="text-xs text-muted-foreground">({complaint.profiles?.email})</span>
            </div>
            <CardTitle className="text-xl mb-2">{complaint.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={displayStatus} />
              {complaint.category && (
                <Badge variant="secondary" className="text-xs">
                  {complaint.category}
                </Badge>
              )}
              {complaint.assigned_admin && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <UserCog className="h-3 w-3" />
                  {complaint.assigned_admin.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(complaint.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manage Complaint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned-to">Assign To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger id="assigned-to">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {adminUsers?.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Add notes about the resolution..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
  );
};
