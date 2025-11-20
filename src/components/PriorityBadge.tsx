import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, Minus, TrendingUp } from "lucide-react";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const config = {
    low: {
      label: "Low",
      variant: "secondary" as const,
      icon: Minus,
      className: "bg-muted text-muted-foreground",
    },
    medium: {
      label: "Medium",
      variant: "secondary" as const,
      icon: Minus,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    high: {
      label: "High",
      variant: "secondary" as const,
      icon: ArrowUp,
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    urgent: {
      label: "Urgent",
      variant: "destructive" as const,
      icon: AlertCircle,
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  };

  const { label, variant, icon: Icon, className } = config[priority];

  return (
    <Badge variant={variant} className={`text-xs flex items-center gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};