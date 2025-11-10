import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "in_progress" | "resolved";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "pending":
        return "bg-status-pending text-black";
      case "in_progress":
        return "bg-status-in-progress text-white";
      case "resolved":
        return "bg-status-resolved text-white";
      default:
        return "";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <Badge variant="default" className={cn(getStatusStyles(), className)}>
      {getStatusLabel()}
    </Badge>
  );
};
