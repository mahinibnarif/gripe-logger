import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplaintCommentsProps {
  complaintId: string;
}

export const ComplaintComments = ({ complaintId }: ComplaintCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ["complaint-comments", complaintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_comments")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      // Map profiles to comments
      return data.map(comment => ({
        ...comment,
        profiles: profiles?.find(p => p.id === comment.user_id) || null,
      }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("complaint_comments").insert({
      complaint_id: complaintId,
      user_id: user?.id,
      content: comment.trim(),
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Comment added successfully",
    });

    setComment("");
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h4 className="font-semibold">Comments & Updates</h4>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.profiles?.name || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.profiles?.email}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to add one!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add a comment or update..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button type="submit" disabled={isSubmitting || !comment.trim()} size="sm">
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </div>
  );
};