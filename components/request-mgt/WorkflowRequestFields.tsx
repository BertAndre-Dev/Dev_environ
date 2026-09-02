"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { fileToDataUri } from "@/lib/uploads/fileToDataUri";
import { GENERAL_ACCEPT_ATTR } from "@/lib/uploads/constants";
import { validateFile } from "@/lib/uploads/validate";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "react-toastify";
import type { RequestWorkflowField } from "@/redux/slice/admin/request/admin-request";

type Props = {
  fields: RequestWorkflowField[];
  values: Record<string, string>;
  fileNames: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  onFileNameChange: (key: string, fileName: string) => void;
  disabled?: boolean;
  encoding?: boolean;
  onEncodingChange?: (encoding: boolean) => void;
};

function FieldLabel({
  htmlFor,
  label,
  required,
  helpText,
}: Readonly<{
  htmlFor: string;
  label: string;
  required?: boolean;
  helpText?: string;
}>) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="mb-0">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      {helpText?.trim() ? (
        <HelpTooltip text={helpText} label={`Help for ${label}`} />
      ) : null}
    </div>
  );
}

export default function WorkflowRequestFields({
  fields,
  values,
  fileNames,
  onValueChange,
  onFileNameChange,
  disabled = false,
  encoding = false,
  onEncodingChange,
}: Readonly<Props>) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!fields.length) return null;

  const handleFileSelected = async (
    field: RequestWorkflowField,
    file: File | undefined,
  ) => {
    if (!file) return;
    const validation = validateFile(file, { kind: "general" });
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    onEncodingChange?.(true);
    try {
      const dataUrl = await fileToDataUri(file);
      onValueChange(field.key, dataUrl);
      onFileNameChange(field.key, file.name);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || "Failed to read file.";
      toast.error(message);
    } finally {
      onEncodingChange?.(false);
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const id = `workflow-request-field-${field.key}`;
        const value = values[field.key] ?? "";
        const placeholder = field.placeholder?.trim() || undefined;

        if (field.type === "textarea") {
          return (
            <div key={field.key}>
              <FieldLabel
                htmlFor={id}
                label={field.label}
                required={field.required}
                helpText={field.helpText}
              />
              <textarea
                id={id}
                value={value}
                onChange={(e) => onValueChange(field.key, e.target.value)}
                placeholder={placeholder}
                required={field.required}
                disabled={disabled}
                className="mt-1 w-full min-h-[88px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          );
        }

        if (field.type === "select") {
          const options = [
            { value: "", label: placeholder || "Select an option" },
            ...(field.options ?? []).map((option) => ({
              value: option,
              label: option,
            })),
          ];
          return (
            <div key={field.key}>
              <FieldLabel
                htmlFor={id}
                label={field.label}
                required={field.required}
                helpText={field.helpText}
              />
              <Select
                id={id}
                options={options}
                value={value}
                onChange={(e) => onValueChange(field.key, e.target.value)}
                required={field.required}
                disabled={disabled}
                className="mt-1 w-full"
              />
            </div>
          );
        }

        if (field.type === "file") {
          const fileName = fileNames[field.key] ?? "";
          return (
            <div key={field.key}>
              <FieldLabel
                htmlFor={id}
                label={field.label}
                required={field.required}
                helpText={field.helpText}
              />
              <input
                ref={(node) => {
                  fileRefs.current[field.key] = node;
                }}
                id={id}
                type="file"
                accept={GENERAL_ACCEPT_ATTR}
                className="hidden"
                disabled={disabled || encoding}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleFileSelected(field, file);
                  e.target.value = "";
                }}
              />
              {fileName && value ? (
                <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="truncate flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{fileName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(field.key, "");
                      onFileNameChange(field.key, "");
                    }}
                    disabled={disabled}
                    className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
                    aria-label={`Remove ${fileName}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  disabled={disabled || encoding}
                  onClick={() => fileRefs.current[field.key]?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {encoding ? "Reading file..." : "Choose file"}
                </Button>
              )}
            </div>
          );
        }

        return (
          <div key={field.key}>
            <FieldLabel
              htmlFor={id}
              label={field.label}
              required={field.required}
              helpText={field.helpText}
            />
            <Input
              id={id}
              type={field.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => onValueChange(field.key, e.target.value)}
              placeholder={placeholder}
              required={field.required}
              disabled={disabled}
              className="mt-1"
            />
          </div>
        );
      })}
    </div>
  );
}
