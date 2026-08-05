"use client";

import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { isPending } from "@/lib/async-status";
import {
  activateUser,
  deleteUser,
  getUser,
  suspendUser,
} from "@/redux/slice/admin/user-mgt/user";
import UserDetailView from "@/app/dashboard/admin/user/components/AdminUserDetailView";

const ADMIN_USER_ACTIONS = {
  getUser,
  activateUser,
  suspendUser,
  deleteUser,
};

export default function AdminUserDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const { user, loading } = useSelector((state: RootState) => ({
    user: state.adminUser.user,
    loading: isPending(state.adminUser.getUserState),
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
    <UserDetailView
      userId={userId}
      user={user}
      userLoading={loading}
      listPath="/dashboard/admin/user"
      actions={ADMIN_USER_ACTIONS}
    />
  );
}
