import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit } from "lucide-react";
import { z } from "zod";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  category: z.string().optional(),
});

interface EditComplaintDialogProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    status: string;
  };
  onUpdate: () => void;
}

export const EditComplaintDialog = ({ complaint, onUpdate }: EditComplaintDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(complaint.title);
  const [description, setDescription] = useState(complaint.description);
  const [category, setCategory] = useState(complaint.category || "");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Only allow editing if complaint is pending
  if (complaint.status !== "pending") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = complaintSchema.safeParse({ title, description, category });
    if (!result.success) {
      const fieldErrors: { title?: string; description?: string } = {};
      result.error.errors.forEach((error) => {
        if (error.path[0] === "title") fieldErrors.title = error.message;
        if (error.path[0] === "description") fieldErrors.description = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("complaints")
      .update({
        title: title.trim(),
        description: description.trim(),
        category: category || null,
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Complaint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="Brief summary of your complaint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category (Optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Academics">Academics</SelectItem>
                <SelectItem value="Hostel">Hostel</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Provide detailed information about your complaint"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Complaint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};