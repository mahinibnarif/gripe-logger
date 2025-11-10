import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
}

export const ComplaintCard = ({ complaint }: ComplaintCardProps) => {
  const status = complaint.status as "pending" | "in_progress" | "resolved";
  
  return (
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
