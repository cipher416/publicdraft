import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as Y from "yjs";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z
    .string()
    .nonempty()
    .trim()
    .max(120, "Title must be 120 characters or fewer"),
});

export function CreateDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const createDocument = useMutation({
    mutationFn: async (input: { title?: string }) => {
      const roomId = crypto.randomUUID();
      const doc = new Y.Doc();
      const update = Y.encodeStateAsUpdate(doc);
      const data = btoa(String.fromCharCode(...update));

      const { data: response, error } = await api.docs.post({
        roomId,
        title: input.title,
        data,
      });

      if (error) {
        throw new Error(error.message || "Failed to create document");
      }

      if (!response) {
        throw new Error("No document returned");
      }

      return response;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpen(false);
      setTitle("");
      toast.success("Document created");
      router.navigate({
        to: "/editor/$roomId",
        params: { roomId: doc.roomId },
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create document");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createDocumentSchema.safeParse({ title });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid title";
      toast.error(message);
      return;
    }

    createDocument.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> New Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          <DialogDescription>
            Start a new collaborative document.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Untitled Document"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={createDocument.isPending}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={createDocument.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDocument.isPending}>
              {createDocument.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
