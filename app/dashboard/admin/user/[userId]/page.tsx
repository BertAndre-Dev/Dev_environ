"use client";

import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { getUser } from "@/redux/slice/admin/user-mgt/user";
import AdminUserDetailView from "../components/AdminUserDetailView";

export default function AdminUserDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const { user, loading } = useSelector((state: RootState) => ({
    user: state.adminUser.user,
    loading: state.adminUser.getUserState === "isLoading",
  }));

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      await dispatch(getUser(userId)).unwrap();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to load user details.",
      );
    }
  }, [dispatch, userId]);

  useEffect(() => {
    fetchUser().catch(() => {});
  }, [fetchUser]);

  return (
    <AdminUserDetailView userId={userId} user={user} userLoading={loading} />
  );
}
