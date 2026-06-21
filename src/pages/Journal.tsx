import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Smile,
  Meh,
  Frown,
  Laugh,
  Angry,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const moods = [
  { value: "Excellent", icon: Laugh, color: "text-green-500" },
  { value: "Good", icon: Smile, color: "text-blue-500" },
  { value: "Neutral", icon: Meh, color: "text-yellow-500" },
  { value: "Bad", icon: Frown, color: "text-orange-500" },
  { value: "Terrible", icon: Angry, color: "text-red-500" },
];

export default function Journal() {
  const utils = trpc.useUtils();
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "Neutral" as string,
    tags: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: entries, isLoading } = trpc.journal.list.useQuery();

  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      toast.success("Journal entry added");
      utils.journal.list.invalidate();
      setNewEntry({
        title: "",
        content: "",
        mood: "Neutral",
        tags: "",
        date: new Date().toISOString().split("T")[0],
      });
      setDialogOpen(false);
    },
  });

  const deleteEntry = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      utils.journal.list.invalidate();
    },
  });

  const handleSubmit = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }
    createEntry.mutate({
      date: newEntry.date,
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood as any,
      tags: newEntry.tags || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
          <p className="text-sm text-muted-foreground">
            Document your thoughts, lessons, and reflections
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) =>
                      setNewEntry((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mood</label>
                  <div className="flex gap-1">
                    {moods.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setNewEntry((prev) => ({ ...prev, mood: m.value }))}
                        className={`p-1.5 rounded-md transition-all ${
                          newEntry.mood === m.value
                            ? "bg-primary/20 ring-1 ring-primary"
                            : "hover:bg-accent"
                        }`}
                        title={m.value}
                      >
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                <Input
                  placeholder="Entry title..."
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Content</label>
                <Textarea
                  placeholder="Write about your trading day, lessons learned, emotions..."
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={6}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (comma separated)</label>
                <Input
                  placeholder="psychology, gold, lesson"
                  value={newEntry.tags}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createEntry.isPending}>
                {createEntry.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Journal Entries */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-32 animate-pulse rounded bg-muted mb-2" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => {
            const mood = moods.find((m) => m.value === entry.mood);
            return (
              <Card key={entry.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {mood && <mood.icon className={`h-4 w-4 ${mood.color}`} />}
                        <h3 className="font-medium text-sm truncate">{entry.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.date).toLocaleDateString()}
                        {entry.tags && (
                          <>
                            <Tag className="h-3 w-3 ml-1" />
                            {entry.tags}
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
                      onClick={() => {
                        if (confirm("Delete this entry?")) {
                          deleteEntry.mutate({ id: entry.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No journal entries yet. Start documenting your trading journey.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
