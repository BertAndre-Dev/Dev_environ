"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertCircle, CheckCircle, LogOut } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutVisitor } from "@/redux/slice/security/visitor/visitor";
import { formatVisitorCode } from "@/lib/utils";
import type { AppDispatch } from "@/redux/store";

interface ClockOutCardProps {
  onClockedOut?: () => void;
}

type FeedbackState = {
  title: string;
  message: string;
  variant: "success" | "error" | "warning";
} | null;

export default function ClockOutCard({ onClockedOut }: ClockOutCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [clockOutCode, setClockOutCode] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 10000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const showFeedback = (
    title: string,
    message: string,
    variant: "success" | "error" | "warning",
  ) => {
    setFeedback({ title, message, variant });
  };

  const handleClockOut = async () => {
    const code = formatVisitorCode(clockOutCode).trim();
    if (!code) {
      showFeedback(
        "Visitor code required",
        "Enter visitor code to clock out.",
        "warning",
      );
      return;
    }
    try {
      setCheckoutLoading(true);
      await dispatch(checkoutVisitor({ visitorCode: code })).unwrap();
      setClockOutCode("");
      onClockedOut?.();
      showFeedback(
        "Clocked out",
        "Visitor clocked out successfully.",
        "success",
      );
    } catch (err: unknown) {
      showFeedback(
        "Clock out failed",
        (err as { message?: string })?.message ?? "Clock out failed",
        "error",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const FeedbackIcon =
    feedback?.variant === "success"
      ? CheckCircle
      : feedback?.variant === "error"
        ? AlertCircle
        : AlertCircle;

  const iconClass =
    feedback?.variant === "success"
      ? "text-green-600"
      : feedback?.variant === "error"
        ? "text-red-600"
        : "text-amber-600";

  return (
    <>
      <Card className="border-border">
        <div className="px-4 pt-4 flex items-center gap-2">
          <LogOut className="h-6 w-6" />
          <CardTitle className="text-xl">Clock out</CardTitle>
        </div>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="page-clock-out-code">Visitor code</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center pb-4">
              <Input
                id="page-clock-out-code"
                value={clockOutCode}
                onChange={(e) =>
                  setClockOutCode(formatVisitorCode(e.target.value))
                }
                placeholder="e.g. LEA-5DWR"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleClockOut();
                }}
              />
              <Button
                type="button"
                onClick={() => void handleClockOut()}
                disabled={checkoutLoading}
                className="gap-2 shrink-0"
              >
                <LogOut className="w-4 h-4" />
                {checkoutLoading ? "Clocking out…" : "Clock out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        visible={Boolean(feedback)}
        onClose={() => setFeedback(null)}
        contentClassName="md:w-[350px] max-w-[350px] p-4"
      >
        {feedback ? (
          <div className="flex items-start gap-3">
            <FeedbackIcon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold mb-1">
                {feedback.title}
              </h2>
              <p className="text-sm text-muted-foreground">{feedback.message}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
