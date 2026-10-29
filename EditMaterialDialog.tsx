import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useI18n, type TKey } from "@/lib/i18n";
import { SUBJECT_KEYS } from "@/lib/materials";

export type EditableMaterial = {
  id: string;
  title: string;
  kind: string;
  subject: string;
  content: string;
  file_path: string | null;
  mime_type: string | null;
};

export function EditMaterialDialog({ material, open, onOpenChange }: {
  material: EditableMaterial;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [title, setTitle] = useState(material.title);
  const [kind, setKind] = useState(material.kind);
  const [subject, setSubject] = useState(material.subject);
  const [content, setContent] = useState(material.content);
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(material.title); setKind(material.kind); setSubject(material.subject);
    setContent(material.content); setFile(null); setRemoveFile(false);
  }, [open, material]);

  const save = useMutation({
    mutationFn: async () => {
      const patch: { title: string; kind: string; subject: string; content: string; file_path?: string | null; mime_type?: string | null } = { title: title.trim(), kind, subject, content };
      if (file) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Not signed in");
        const path = `${u.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("materials").upload(path, file, { contentType: file.type });
        if (error) throw error;
        patch.file_path = path;
        patch.mime_type = file.type;
      } else if (removeFile) {
        patch.file_path = null;
        patch.mime_type = null;
      }
      const { error } = await supabase.from("materials").update(patch).eq("id", material.id);
      if (error) throw error;
      if ((file || removeFile) && material.file_path) {
        await supabase.storage.from("materials").remove([material.file_path]);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["material", material.id] });
      toast.success(t("saved"));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hasFile = !!material.file_path && !removeFile;
  const valid = title.trim() && (content.trim() || hasFile || file);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader><DialogTitle>{t("editMaterial")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title")} className="rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <select aria-label={t("type")} value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 rounded-xl border bg-card px-3 text-sm">
              <option value="syllabus">{t("syllabus")}</option>
              <option value="past_paper">{t("pastPaper")}</option>
            </select>
            <select aria-label={t("subject")} value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 rounded-xl border bg-card px-3 text-sm">
              {SUBJECT_KEYS.map((s) => <option key={s} value={s}>{t(`subj_${s}` as TKey)}</option>)}
            </select>
          </div>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("pasteText")} className="min-h-40 rounded-xl" />
          <div className="rounded-xl bg-secondary/60 p-3 text-sm">
            {hasFile && !file && (
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-muted-foreground">{material.file_path!.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "")}</span>
                <button type="button" className="shrink-0 text-destructive hover:underline" onClick={() => setRemoveFile(true)}>{t("removeFile")}</button>
              </div>
            )}
            <label className="block text-xs text-muted-foreground">
              {hasFile ? t("replaceFile") : t("file")}
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-card file:px-3 file:py-1.5 file:text-sm" />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export async function deleteMaterial(id: string, path: string | null) {
  if (path) await supabase.storage.from("materials").remove([path]);
  await supabase.from("study_sets").delete().eq("material_id", id);
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
}
