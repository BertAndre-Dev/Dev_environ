"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IsoDatePicker } from "@/components/ui/iso-date-picker";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/redux/store";
import {
  getUser,
  updateUser,
} from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import Loader from "@/components/ui/Loader";

export type EditableUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  role?: string;
  residentType?: string | null;
};

type EditUserFormProps = {
  userId: string;
  close: () => void;
  onUpdated?: () => void;
};

type EditUserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
};

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
}

function emptyForm(): EditUserFormData {
  return {
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    address: "",
  };
}

function mapUserToForm(user: EditableUser): EditUserFormData {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    countryCode: user.countryCode ?? "",
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    gender: user.gender ?? "",
    phoneNumber: user.phoneNumber ?? "",
    address: user.address ?? "",
  };
}

export default function EditUserForm({
  userId,
  close,
  onUpdated,
}: EditUserFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<string | undefined>();
  const [residentType, setResidentType] = useState<string | null | undefined>();
  const [formData, setFormData] = useState<EditUserFormData>(emptyForm);

  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      toast.error("User id is missing");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingUser(true);
        const res = await dispatch(getUser(userId)).unwrap();
        const user = (res?.data ?? res) as EditableUser;
        if (cancelled) return;
        setFormData(mapUserToForm(user));
        setRole(user.role);
        setResidentType(user.residentType);
      } catch (err: unknown) {
        if (cancelled) return;
        toast.error(
          (err as { message?: string })?.message || "Failed to load user details",
        );
        close();
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once per userId open
  }, [dispatch, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User id is missing");
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        updateUser({
          id: userId,
          data: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            countryCode: formData.countryCode.trim(),
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            phoneNumber: formData.phoneNumber.trim(),
            address: formData.address.trim(),
            role,
            residentType: residentType ?? undefined,
          },
        }),
      ).unwrap();
      toast.success(res?.message || "User details updated successfully");
      onUpdated?.();
      close();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to update user",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-2 relative min-h-[200px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Edit user details</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingUser ? (
          <div className="py-10">
            <Loader label="Loading user details..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-countryCode">Country Code</Label>
                <Input
                  id="edit-countryCode"
                  name="countryCode"
                  placeholder="+234"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                <IsoDatePicker
                  id="edit-dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                  }
                  className="mt-1 h-10"
                  ariaLabel="Date of Birth"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <select
                  id="edit-gender"
                  title="Gender"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full h-10 px-3 mt-1 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1"
              />
            </div> */}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Updating..." : "Update user"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
