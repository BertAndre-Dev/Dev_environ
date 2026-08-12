"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEmptyWorkflowStep,
  type RequestWorkflow,
  type WorkflowStep,
} from "@/redux/slice/admin/request/admin-request";
import WorkflowStepsEditor from "./WorkflowStepsEditor";

interface WorkflowConfigModalProps {
  readonly visible: boolean;
  readonly estateId?: string | null;
  readonly workflow: RequestWorkflow | null;
  readonly loading?: boolean;
  readonly saving?: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: {
    name: string;
    description?: string;
    steps: WorkflowStep[];
  }) => Promise<void>;
}

export default function WorkflowConfigModal({
  visible,
  estateId,
  workflow,
  loading = false,
  saving = false,
  onClose,
  onSave,
}: WorkflowConfigModalProps) {
  const [name, setName] = useState("Standard estate request approval");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([
    createEmptyWorkflowStep(1),
  ]);

  useEffect(() => {
    if (!visible) return;
    if (!workflow) {
      setName("Standard estate request approval");
      setDescription("");
      setSteps([createEmptyWorkflowStep(1)]);
      return;
    }
    setName(workflow.name?.trim() || "Standard estate request approval");
    setDescription(workflow.description ?? "");
    setSteps(
      workflow.steps && workflow.steps.length > 0
        ? workflow.steps
        : [createEmptyWorkflowStep(1)],
    );
  }, [visible, workflow]);

  const busy = loading || saving;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || steps.length === 0) return;
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        steps,
      });
    } catch {
      // Parent surfaces the error toast; keep form values for retry.
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      contentClassName="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0"
    >
      <div className="flex flex-col min-h-0 max-h-[90vh]">
        <div className="shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-black/5 bg-white/80 backdrop-blur-xl">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">
            Configure approval workflow
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            Create or replace the estate&apos;s active request approval path.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5">
          {loading ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Loading workflow...
            </p>
          ) : (
            <form
              id="workflow-config-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="workflow-name">Workflow name</Label>
                <Input
                  id="workflow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Standard estate request approval"
                  className="mt-1.5 rounded-xl"
                  disabled={busy}
                  required
                />
              </div>

              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <textarea
                  id="workflow-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this approval path..."
                  className="mt-1.5 w-full min-h-[88px] rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={busy}
                />
              </div>

              <WorkflowStepsEditor
                steps={steps}
                onChange={setSteps}
                estateId={estateId}
                disabled={busy}
              />
            </form>
          )}
        </div>

        {!loading && (
          <div className="shrink-0 flex gap-2 justify-end px-5 sm:px-6 py-4 border-t border-black/5 bg-white/80 backdrop-blur-xl">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="workflow-config-form"
              disabled={busy || !name.trim() || steps.length === 0}
              className="rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save workflow"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
