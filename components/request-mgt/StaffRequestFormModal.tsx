"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Modal from "@/components/modal/page";
import { fileToBase64 } from "@/lib/file-to-base64";
import { getApiErrorMessage } from "@/lib/api-error";
import axiosInstance from "@/utils/axiosInstance";
import {
  extractWorkflowList,
  type RequestWorkflow,
} from "@/redux/slice/admin/request/admin-request";
import type {
  CreateStaffRequestPayload,
  StaffRequestCategory,
} from "@/redux/slice/staff/request/staff-request";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;
const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf";

type FormPayload = Omit<CreateStaffRequestPayload, "estateId">;

interface StaffRequestFormModalProps {
  readonly visible: boolean;
  readonly estateId: string;
  readonly categories: StaffRequestCategory[];
  readonly categoriesLoading?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: FormPayload) => Promise<void>;
  readonly loading?: boolean;
}

export default function StaffRequestFormModal({
  visible,
  estateId,
  categories,
  categoriesLoading = false,
  onClose,
  onSubmit,
  loading = false,
}: StaffRequestFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<RequestWorkflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; dataUrl: string }[]
  >([]);
  const [encoding, setEncoding] = useState(false);

  const categoryOptions = categories.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const workflowOptions = useMemo(() => {
    const named = workflows
      .map((workflow) => {
        const value = (workflow.id ?? workflow._id ?? "").trim();
        const label = workflow.name.trim();
        if (!value || !label) return null;
        return { value, label };
      })
      .filter((option): option is { value: string; label: string } =>
        Boolean(option),
      );

    if (named.length === 0) {
      return [
        {
          value: "",
          label: workflowsLoading
            ? "Loading workflows..."
            : "No workflow configured",
        },
      ];
    }

    return [{ value: "", label: "Use estate default" }, ...named];
  }, [workflows, workflowsLoading]);

  useEffect(() => {
    if (!categories.length) {
      setCategory("");
      return;
    }
    setCategory((prev) =>
      categories.some((c) => c.value === prev) ? prev : categories[0].value,
    );
  }, [categories]);

  useEffect(() => {
    if (!visible || !estateId) return;

    let cancelled = false;
    setWorkflowsLoading(true);

    axiosInstance
      .get("/api/v1/requests/workflows", { params: { estateId } })
      .then((res) => {
        if (cancelled) return;
        const list = extractWorkflowList(res.data);
        setWorkflows(list);
        setWorkflowId((prev) => {
          const ids = list
            .map((workflow) => (workflow.id ?? workflow._id ?? "").trim())
            .filter(Boolean);
          if (prev && ids.includes(prev)) return prev;
          return ids[0] ?? "";
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          setWorkflows([]);
          setWorkflowId("");
          return;
        }
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setWorkflows([]);
      })
      .finally(() => {
        if (!cancelled) setWorkflowsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, estateId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(categories[0]?.value ?? "");
    setWorkflowId("");
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (loading || encoding) return;
    resetForm();
    onClose();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      e.target.value = "";
      return;
    }

    const selected = files.slice(0, remaining);
    setEncoding(true);
    try {
      const next: { name: string; dataUrl: string }[] = [];
      for (const file of selected) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} exceeds 10MB.`);
          continue;
        }
        const dataUrl = await fileToBase64(file);
        next.push({ name: file.name, dataUrl });
      }
      if (next.length) {
        setAttachments((prev) => [...prev, ...next]);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || "Failed to read file.";
      toast.error(message);
    } finally {
      setEncoding(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !estateId) return;

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        attachments:
          attachments.length > 0
            ? attachments.map((a) => a.dataUrl)
            : undefined,
        workflowId: workflowId.trim() || undefined,
      });
      resetForm();
    } catch {
      // Parent surfaces the error toast; keep form values for retry.
    }
  };

  const valid = Boolean(
    title.trim() && category && estateId && categories.length > 0,
  );
  // Only block the whole form while submitting or encoding files.
  // Category loading should not disable title/description/etc.
  const busy = loading || encoding;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-5 sm:p-6">
        <h2 className="font-heading text-xl font-semibold mb-1">
          New request
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Submit a request for approval.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="staff-request-title">Title</Label>
            <Input
              id="staff-request-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gate motor replacement"
              className="mt-1"
              required
              disabled={busy}
            />
          </div>

          <div>
            <Label htmlFor="staff-request-description">Description</Label>
            <textarea
              id="staff-request-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the request in detail..."
              className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={busy}
            />
          </div>

          <div>
            <Label htmlFor="staff-request-category">Category</Label>
            <Select
              id="staff-request-category"
              options={
                categoryOptions.length > 0
                  ? categoryOptions
                  : [{ value: "", label: categoriesLoading ? "Loading..." : "No categories" }]
              }
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full"
              disabled={
                busy || categoriesLoading || categoryOptions.length === 0
              }
            />
          </div>

          <div>
            <Label htmlFor="staff-request-workflow">Workflow</Label>
            <Select
              id="staff-request-workflow"
              options={workflowOptions}
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="mt-1 w-full"
              disabled={busy || workflowsLoading || workflows.length === 0}
            />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="mt-1 space-y-2">
              {attachments.length > 0 && (
                <ul className="space-y-1.5">
                  {attachments.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate flex items-center gap-2 min-w-0">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        disabled={busy}
                        className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                className="hidden"
                onChange={handleFilesSelected}
                disabled={busy || attachments.length >= MAX_ATTACHMENTS}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || attachments.length >= MAX_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {encoding ? "Reading files..." : "Add files"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Up to {MAX_ATTACHMENTS} files, 10MB each.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || busy}>
              {loading ? "Submitting..." : "Submit for approval"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
