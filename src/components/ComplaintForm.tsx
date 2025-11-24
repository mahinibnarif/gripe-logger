import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { DialogHeader, DialogTitle } from "./ui/dialog";
import { Upload, X, FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  category: z.string().optional(),
  priority: z.string().optional(),
});

interface ComplaintFormProps {
  onSuccess: () => void;
}

export const ComplaintForm = ({ onSuccess }: ComplaintFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Check file sizes
    const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Error",
        description: `Some files are too large. Maximum size is 5MB per file.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = complaintSchema.safeParse({ title, description, category, priority });
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

    const { data: complaint, error } = await supabase.from("complaints").insert({
      title: title.trim(),
      description: description.trim(),
      category: category || null,
      priority: priority || "medium",
      student_id: user?.id,
    }).select().single();

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive",
      });
      return;
    }

    // Upload files if any
    if (selectedFiles.length > 0 && complaint) {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user?.id}/${complaint.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("complaint-attachments")
          .upload(fileName, file);

        if (!uploadError) {
          await supabase.from("complaint_attachments").insert({
            complaint_id: complaint.id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            content_type: file.type,
            uploaded_by: user?.id,
          });
        }
      }
    }

    setIsLoading(false);

    toast({
      title: "Success",
      description: "Your complaint has been submitted successfully",
    });

    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setSelectedFiles([]);
    onSuccess();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Submit New Complaint</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Brief summary of your complaint"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
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
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Provide detailed information about your complaint..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        <div className="space-y-2">
          <Label>Attachments (Optional)</Label>
          <div className="space-y-3">
            <Button type="button" variant="outline" size="sm" disabled={isLoading} asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Add Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </label>
            </Button>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Complaint"}
          </Button>
        </div>
      </form>
    </>
  );
};
