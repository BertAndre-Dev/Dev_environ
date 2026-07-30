// "use client";

// import { useEffect, useMemo, useState, type ReactNode } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useDispatch, useSelector } from "react-redux";
// import { Building2, MapPin, Phone, Settings, User, Zap } from "lucide-react";
// import Modal from "@/components/modal/page";
// import { Button } from "@/components/ui/button";
// import Loader from "@/components/ui/Loader";
// import { CopyButton } from "@/components/ui/copy-button";
// import type { AppDispatch, RootState } from "@/redux/store";
// import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
// import { getUserProfile } from "@/redux/slice/resident/user-profile/user-profile";
// import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
// import {
//   formatAddressLabel,
//   normalizeAddresses,
//   type AddressOption,
// } from "@/lib/address";
// import { formatDate, formatDateTime } from "@/lib/format-date";
// import { extractEstateNameFromUser, extractUserId } from "@/lib/user-id";
// import { normalizeMeterFromApiResponse } from "@/lib/user-address-meters";
// import { selectResidentCode } from "@/redux/slice/auth-mgt/auth-mgt-slice";
// import type { ResidentMeterData } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";

// type Props = Readonly<{
//   open: boolean;
//   onClose: () => void;
// }>;

// type ProfileRecord = Record<string, unknown>;

// function formatLabel(value?: string | null) {
//   if (!value) return "—";
//   return value
//     .split(/[\s_-]+/)
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//     .join(" ");
// }

// function asString(value: unknown): string {
//   return typeof value === "string" ? value : "";
// }

// function asBool(value: unknown): boolean | undefined {
//   return typeof value === "boolean" ? value : undefined;
// }

// function DetailField({
//   label,
//   value,
//   copyValue,
// }: Readonly<{
//   label: string;
//   value: ReactNode;
//   copyValue?: string;
// }>) {
//   return (
//     <div className="py-3 border-b border-border/50 last:border-0">
//       <p className="text-xs text-muted-foreground mb-1">{label}</p>
//       <div className="text-sm font-medium flex flex-wrap items-center gap-2">
//         {value}
//         {copyValue ? (
//           <CopyButton
//             value={copyValue}
//             copiedLabel="Copied"
//             title={`Copy ${label.toLowerCase()}`}
//           />
//         ) : null}
//       </div>
//     </div>
//   );
// }

// function StatusPill({
//   children,
//   tone,
// }: Readonly<{
//   children: ReactNode;
//   tone: "green" | "red" | "amber" | "blue" | "slate";
// }>) {
//   const tones = {
//     green: "bg-green-50 text-green-700 ring-green-200",
//     red: "bg-red-50 text-red-700 ring-red-200",
//     amber: "bg-amber-50 text-amber-700 ring-amber-200",
//     blue: "bg-blue-50 text-blue-700 ring-blue-200",
//     slate: "bg-slate-100 text-slate-600 ring-slate-200",
//   };
//   return (
//     <span
//       className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
//     >
//       {children}
//     </span>
//   );
// }

// function MeterNumberValue({
//   meterNumber,
// }: Readonly<{ meterNumber: string | null }>) {
//   if (!meterNumber) {
//     return (
//       <span className="text-sm text-muted-foreground italic">Not assigned</span>
//     );
//   }
//   return (
//     <div className="flex items-center gap-2">
//       <span className="font-mono text-sm font-semibold">{meterNumber}</span>
//       <CopyButton
//         value={meterNumber}
//         copiedLabel="Copied"
//         title="Copy meter number"
//       />
//     </div>
//   );
// }

// function extractMeterNumber(res: unknown): string | null {
//   if (!res || typeof res !== "object") return null;
//   const payload = res as { data?: unknown };
//   // Prefer API `data` (same as admin user detail / meter slice)
//   const fromData = normalizeMeterFromApiResponse(res);
//   if (fromData) return fromData;
//   const nested = payload.data;
//   if (nested && typeof nested === "object" && !Array.isArray(nested)) {
//     const meter = nested as ResidentMeterData;
//     return meter.meterNumber ?? null;
//   }
//   if (Array.isArray(nested) && nested[0]) {
//     return (nested[0] as ResidentMeterData).meterNumber ?? null;
//   }
//   return null;
// }

// export function ResidentProfileModal({ open, onClose }: Props) {
//   const dispatch = useDispatch<AppDispatch>();
//   const authUser = useSelector(
//     (state: RootState) => state.auth.user,
//   ) as ProfileRecord | null;
//   const profileUser = useSelector(
//     (state: RootState) => state.userProfile.user,
//   ) as ProfileRecord | null;
//   const getStatus = useSelector(
//     (state: RootState) => state.userProfile.getStatus,
//   );
//   const profileError = useSelector(
//     (state: RootState) => state.userProfile.error,
//   );
//   const residentCode = useSelector(selectResidentCode);

//   const [meterByAddressId, setMeterByAddressId] = useState<
//     Record<string, string | null>
//   >({});
//   const [metersLoading, setMetersLoading] = useState(false);

//   const userId = useMemo(
//     () => extractUserId(authUser) ?? extractUserId(profileUser),
//     [authUser, profileUser],
//   );

//   const display = useMemo(() => {
//     return { ...authUser, ...profileUser } as ProfileRecord;
//   }, [authUser, profileUser]);

//   const addresses: AddressOption[] = useMemo(() => {
//     // Prefer auth/session addresses — profile endpoint often omits addressIds
//     const fromAuth = normalizeAddresses(authUser);
//     if (fromAuth.length > 0) return fromAuth;
//     return normalizeAddresses(display);
//   }, [authUser, display]);

//   const addressIdsKey = useMemo(
//     () => addresses.map((a) => a.id).join(","),
//     [addresses],
//   );

//   const meterNumbers = useMemo(() => {
//     const unique = Array.from(
//       new Set(
//         addresses
//           .map((addr) => meterByAddressId[addr.id])
//           .filter((value): value is string => Boolean(value)),
//       ),
//     );
//     return unique;
//   }, [addresses, meterByAddressId]);

//   const phoneDisplay = useMemo(() => {
//     const code = asString(display.countryCode).trim();
//     const phone = asString(display.phoneNumber).trim();
//     if (code && phone) return `${code} ${phone}`;
//     return phone || code || "—";
//   }, [display]);

//   const estateName =
//     extractEstateNameFromUser(display) ||
//     extractEstateNameFromUser(authUser) ||
//     "—";

//   const fullName =
//     `${asString(display.firstName)} ${asString(display.lastName)}`.trim() ||
//     "Resident";
//   const image = asString(display.image) || "/profile.svg";
//   const role = asString(display.role) || "resident";
//   const residentType = asString(display.residentType);
//   const email = asString(display.email);
//   const isActive = asBool(display.isActive);
//   const isVerified = asBool(display.isVerified);
//   const serviceCharge = asBool(display.serviceCharge);
//   const invitationStatus = asString(display.invitationStatus);
//   const hasWallet = Boolean(
//     display.walletId &&
//     display.walletId !== null &&
//     typeof display.walletId !== "object" &&
//     String(display.walletId).trim() !== "",
//   );

//   useEffect(() => {
//     if (!open) return;
//     // Refresh /me so addressIds (needed for meters) are present
//     dispatch(getSignedInUser()).catch(() => {
//       // Auth layout already handles session expiry
//     });
//   }, [dispatch, open]);

//   useEffect(() => {
//     if (!open || !userId) return;
//     dispatch(getUserProfile(userId));
//   }, [dispatch, open, userId]);

//   useEffect(() => {
//     if (!open || !addressIdsKey) {
//       setMeterByAddressId({});
//       setMetersLoading(false);
//       return;
//     }

//     const ids = addressIdsKey.split(",").filter(Boolean);
//     let cancelled = false;
//     setMetersLoading(true);

//     (async () => {
//       const entries = await Promise.all(
//         ids.map(async (addressId) => {
//           try {
//             const res = await dispatch(
//               getMeterByAddress({ addressId }),
//             ).unwrap();
//             return [addressId, extractMeterNumber(res)] as const;
//           } catch {
//             return [addressId, null] as const;
//           }
//         }),
//       );
//       if (!cancelled) {
//         setMeterByAddressId(Object.fromEntries(entries));
//         setMetersLoading(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [addressIdsKey, dispatch, open]);

//   const loading = open && (getStatus === "isLoading" || !userId);

//   return (
//     <Modal
//       visible={open}
//       onClose={onClose}
//       contentClassName="md:w-[720px] max-w-[720px] max-h-[90vh] overflow-y-auto p-6"
//     >
//       <div className="pr-2 space-y-6">
//         <div className="border-b border-border pb-4">
//           <h2 className="font-heading text-xl font-bold text-foreground">
//             My profile
//           </h2>
//           <p className="text-sm text-muted-foreground mt-1">
//             Your resident account details for this estate
//           </p>
//         </div>

//         {loading ? (
//           <div className="py-12">
//             <Loader label="Loading profile..." />
//           </div>
//         ) : null}

//         {!loading && profileError && !profileUser ? (
//           <p className="text-sm text-destructive py-8 text-center">
//             {profileError}
//           </p>
//         ) : null}

//         {!loading && !(profileError && !profileUser) ? (
//           <>
//             <div className="flex flex-col sm:flex-row sm:items-center gap-4">
//               <div className="bg-[#4E61E5] rounded-full overflow-hidden w-16 h-16 shrink-0">
//                 <Image
//                   src={image}
//                   alt={fullName}
//                   width={64}
//                   height={64}
//                   className="rounded-full object-cover w-full h-full"
//                 />
//               </div>
//               <div className="min-w-0 flex-1 space-y-2">
//                 <div>
//                   <p className="text-lg font-semibold truncate">{fullName}</p>
//                   <p className="text-sm text-muted-foreground">
//                     {formatLabel(residentType || role)}
//                     {estateName !== "—" ? ` · ${estateName}` : ""}
//                   </p>
//                 </div>
//                 <div className="flex flex-wrap gap-2">
//                   {isActive != null ? (
//                     <StatusPill tone={isActive ? "green" : "red"}>
//                       {isActive ? "Active" : "Inactive"}
//                     </StatusPill>
//                   ) : null}
//                   {isVerified != null ? (
//                     <StatusPill tone={isVerified ? "green" : "amber"}>
//                       {isVerified ? "Verified" : "Unverified"}
//                     </StatusPill>
//                   ) : null}
//                   {serviceCharge != null ? (
//                     <StatusPill tone={serviceCharge ? "blue" : "slate"}>
//                       {serviceCharge
//                         ? "Service charge on"
//                         : "Service charge off"}
//                     </StatusPill>
//                   ) : null}
//                   {invitationStatus ? (
//                     <StatusPill tone="slate">
//                       {formatLabel(invitationStatus)}
//                     </StatusPill>
//                   ) : null}
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//               <div>
//                 <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
//                   <User className="h-4 w-4 text-primary" />
//                   Personal details
//                 </h3>
//                 <DetailField
//                   label="First name"
//                   value={asString(display.firstName) || "—"}
//                 />
//                 <DetailField
//                   label="Last name"
//                   value={asString(display.lastName) || "—"}
//                 />
//                 <DetailField
//                   label="Gender"
//                   value={formatLabel(asString(display.gender))}
//                 />
//                 <DetailField
//                   label="Date of birth"
//                   value={formatDate(asString(display.dateOfBirth) || null)}
//                 />
//                 <DetailField
//                   label="Resident type"
//                   value={formatLabel(residentType || "Resident")}
//                 />
//                 {residentCode ? (
//                   <DetailField
//                     label="Resident code"
//                     value={residentCode}
//                     copyValue={residentCode}
//                   />
//                 ) : null}
//               </div>

//               <div>
//                 <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
//                   <Phone className="h-4 w-4 text-primary" />
//                   Contact & account
//                 </h3>
//                 <DetailField
//                   label="Email"
//                   value={email || "—"}
//                   copyValue={email || undefined}
//                 />
//                 <DetailField
//                   label="Phone"
//                   value={phoneDisplay}
//                   copyValue={phoneDisplay !== "—" ? phoneDisplay : undefined}
//                 />
//                 <DetailField label="Role" value={formatLabel(role)} />
//                 {asString(display.address) ? (
//                   <DetailField
//                     label="Address"
//                     value={asString(display.address)}
//                   />
//                 ) : null}
//                 <DetailField
//                   label="Wallet"
//                   value={hasWallet ? "Linked" : "Not linked"}
//                 />
//                 <DetailField
//                   label="Meter number"
//                   value={
//                     metersLoading ? (
//                       <span className="text-muted-foreground text-xs">
//                         Loading…
//                       </span>
//                     ) : meterNumbers.length > 0 ? (
//                       <div className="space-y-1">
//                         {meterNumbers.map((num) => (
//                           <MeterNumberValue key={num} meterNumber={num} />
//                         ))}
//                       </div>
//                     ) : (
//                       <span className="text-muted-foreground italic">
//                         Not assigned
//                       </span>
//                     )
//                   }
//                 />
//                 <DetailField
//                   label="Member since"
//                   value={formatDateTime(asString(display.createdAt) || null)}
//                 />
//                 <DetailField
//                   label="Last updated"
//                   value={formatDateTime(asString(display.updatedAt) || null)}
//                 />
//               </div>
//             </div>

//             <div className="border-t border-border pt-6">
//               <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
//                 <Zap className="h-4 w-4 text-primary" />
//                 Meter
//               </h3>
//               {metersLoading ? (
//                 <p className="text-sm text-muted-foreground">
//                   Loading meter number…
//                 </p>
//               ) : meterNumbers.length > 0 ? (
//                 <div className="space-y-3">
//                   {addresses.map((addr, index) => {
//                     const meterNumber = meterByAddressId[addr.id] ?? null;
//                     if (!meterNumber) return null;
//                     return (
//                       <div
//                         key={addr.id || index}
//                         className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
//                       >
//                         <div className="min-w-0">
//                           <p className="text-xs text-muted-foreground mb-1">
//                             {addresses.length > 1
//                               ? `Address ${index + 1}`
//                               : "Linked address"}
//                           </p>
//                           <p className="text-sm font-medium truncate">
//                             {formatAddressLabel(addr)}
//                           </p>
//                         </div>
//                         <MeterNumberValue meterNumber={meterNumber} />
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <p className="text-sm text-muted-foreground">
//                   No meter number attached to this resident.
//                 </p>
//               )}
//             </div>

//             <div className="flex flex-row gap-4 border-t border-border pt-6">
//               <div>
//                 <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
//                   <MapPin className="h-4 w-4 text-primary" />
//                   Addresses
//                 </h3>
//                 {addresses.length === 0 ? (
//                   <p className="text-sm text-muted-foreground">
//                     No addresses linked to this account.
//                   </p>
//                 ) : (
//                   <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                     {addresses.map((addr, index) => (
//                       <div
//                         key={addr.id || index}
//                         className="rounded-lg border border-border p-4"
//                       >
//                         <p className="mb-2 text-xs font-medium text-muted-foreground">
//                           Address {index + 1}
//                         </p>
//                         {addr.data && Object.keys(addr.data).length > 0 ? (
//                           <dl className="space-y-1">
//                             {Object.entries(addr.data).map(([key, val]) => (
//                               <div
//                                 key={key}
//                                 className="flex justify-between gap-4 text-sm"
//                               >
//                                 <dt className="text-muted-foreground capitalize">
//                                   {key.replace(/([A-Z])/g, " $1")}
//                                 </dt>
//                                 <dd className="font-medium text-right">
//                                   {val || "—"}
//                                 </dd>
//                               </div>
//                             ))}
//                           </dl>
//                         ) : (
//                           <p className="text-sm font-medium">
//                             {formatAddressLabel(addr)}
//                           </p>
//                         )}
//                         <div className="flex justify-between gap-4 border-t border-border/60 pt-2 mt-2 text-sm">
//                           <span className="text-muted-foreground">
//                             Meter number
//                           </span>
//                           <span className="text-right">
//                             {metersLoading ? (
//                               <span className="text-muted-foreground text-xs">
//                                 Loading…
//                               </span>
//                             ) : (
//                               <MeterNumberValue
//                                 meterNumber={meterByAddressId[addr.id] ?? null}
//                               />
//                             )}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="">
//                 <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
//                   <Building2 className="h-4 w-4 text-primary" />
//                   Estate
//                 </h3>
//                 <DetailField label="Current estate" value={estateName} />
//               </div>
//             </div>

//             <div className="flex justify-end pt-2">
//               <Button asChild variant="outline" size="sm">
//                 <Link href="/dashboard/settings" onClick={onClose}>
//                   <Settings className="h-4 w-4 mr-2" />
//                   Edit in Settings
//                 </Link>
//               </Button>
//             </div>
//           </>
//         ) : null}
//       </div>
//     </Modal>
//   );
// }


"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Check,
  MapPin,
  Phone,
  RotateCcw,
  Settings,
  User,
  X,
  Zap,
} from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { CopyButton } from "@/components/ui/copy-button";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getUserProfile } from "@/redux/slice/resident/user-profile/user-profile";
import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import {
  formatAddressLabel,
  normalizeAddresses,
  type AddressOption,
} from "@/lib/address";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { extractEstateNameFromUser, extractUserId } from "@/lib/user-id";
import { normalizeMeterFromApiResponse } from "@/lib/user-address-meters";
import { selectResidentCode } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { ResidentMeterData } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

type ProfileRecord = Record<string, unknown>;

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function DetailField({
  label,
  value,
  copyValue,
}: Readonly<{
  label: string;
  value: ReactNode;
  copyValue?: string;
}>) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium flex flex-wrap items-center gap-2">
        {value}
        {copyValue ? (
          <CopyButton
            value={copyValue}
            copiedLabel="Copied"
            title={`Copy ${label.toLowerCase()}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  children,
  tone,
  icon,
}: Readonly<{
  children: ReactNode;
  tone: "green" | "red" | "amber" | "blue" | "slate";
  icon?: "check" | "x";
}>) {
  const tones = {
    green: "bg-green-50 text-green-700 ring-green-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {icon === "check" ? <Check className="h-3 w-3" /> : null}
      {icon === "x" ? <X className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

function MeterNumberValue({
  meterNumber,
}: Readonly<{ meterNumber: string | null }>) {
  if (!meterNumber) {
    return (
      <span className="text-sm text-muted-foreground italic">Not assigned</span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-semibold">{meterNumber}</span>
      <CopyButton
        value={meterNumber}
        copiedLabel="Copied"
        title="Copy meter number"
      />
    </div>
  );
}

function extractMeterNumber(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const payload = res as { data?: unknown };
  // Prefer API `data` (same as admin user detail / meter slice)
  const fromData = normalizeMeterFromApiResponse(res);
  if (fromData) return fromData;
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const meter = nested as ResidentMeterData;
    return meter.meterNumber ?? null;
  }
  if (Array.isArray(nested) && nested[0]) {
    return (nested[0] as ResidentMeterData).meterNumber ?? null;
  }
  return null;
}

export function ResidentProfileModal({ open, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector(
    (state: RootState) => state.auth.user,
  ) as ProfileRecord | null;
  const profileUser = useSelector(
    (state: RootState) => state.userProfile.user,
  ) as ProfileRecord | null;
  const getStatus = useSelector(
    (state: RootState) => state.userProfile.getStatus,
  );
  const profileError = useSelector(
    (state: RootState) => state.userProfile.error,
  );
  const residentCode = useSelector(selectResidentCode);

  const [meterByAddressId, setMeterByAddressId] = useState<
    Record<string, string | null>
  >({});
  const [metersLoading, setMetersLoading] = useState(false);

  const userId = useMemo(
    () => extractUserId(authUser) ?? extractUserId(profileUser),
    [authUser, profileUser],
  );

  const display = useMemo(() => {
    return { ...authUser, ...profileUser } as ProfileRecord;
  }, [authUser, profileUser]);

  const addresses: AddressOption[] = useMemo(() => {
    // Prefer auth/session addresses — profile endpoint often omits addressIds
    const fromAuth = normalizeAddresses(authUser);
    if (fromAuth.length > 0) return fromAuth;
    return normalizeAddresses(display);
  }, [authUser, display]);

  const addressIdsKey = useMemo(
    () => addresses.map((a) => a.id).join(","),
    [addresses],
  );

  const phoneDisplay = useMemo(() => {
    const code = asString(display.countryCode).trim();
    const phone = asString(display.phoneNumber).trim();
    if (code && phone) return `${code} ${phone}`;
    return phone || code || "—";
  }, [display]);

  const estateName =
    extractEstateNameFromUser(display) ||
    extractEstateNameFromUser(authUser) ||
    "—";

  const fullName =
    `${asString(display.firstName)} ${asString(display.lastName)}`.trim() ||
    "Resident";
  const image = asString(display.image) || "/profile.svg";
  const role = asString(display.role) || "resident";
  const residentType = asString(display.residentType);
  const email = asString(display.email);
  const isActive = asBool(display.isActive);
  const isVerified = asBool(display.isVerified);
  const serviceCharge = asBool(display.serviceCharge);
  const invitationStatus = asString(display.invitationStatus);
  const hasWallet = Boolean(
    display.walletId &&
    display.walletId !== null &&
    typeof display.walletId !== "object" &&
    String(display.walletId).trim() !== "",
  );

  const fetchProfile = () => {
    if (userId) dispatch(getUserProfile(userId));
  };

  useEffect(() => {
    if (!open) return;
    // Refresh /me so addressIds (needed for meters) are present
    dispatch(getSignedInUser()).catch(() => {
      // Auth layout already handles session expiry
    });
  }, [dispatch, open]);

  useEffect(() => {
    if (!open || !userId) return;
    dispatch(getUserProfile(userId));
  }, [dispatch, open, userId]);

  useEffect(() => {
    if (!open || !addressIdsKey) {
      setMeterByAddressId({});
      setMetersLoading(false);
      return;
    }

    const ids = addressIdsKey.split(",").filter(Boolean);
    let cancelled = false;
    setMetersLoading(true);

    (async () => {
      const entries = await Promise.all(
        ids.map(async (addressId) => {
          try {
            const res = await dispatch(
              getMeterByAddress({ addressId }),
            ).unwrap();
            return [addressId, extractMeterNumber(res)] as const;
          } catch {
            return [addressId, null] as const;
          }
        }),
      );
      if (!cancelled) {
        setMeterByAddressId(Object.fromEntries(entries));
        setMetersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addressIdsKey, dispatch, open]);

  const loading = open && (getStatus === "isLoading" || !userId);

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="md:w-[720px] max-w-[720px] max-h-[90vh] overflow-y-auto p-0"
    >
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          My profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your resident account details for this estate
        </p>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-6">
        {loading ? (
          <div className="py-12">
            <Loader label="Loading profile..." />
          </div>
        ) : null}

        {!loading && profileError && !profileUser ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-destructive">{profileError}</p>
            <Button variant="outline" size="sm" onClick={fetchProfile}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : null}

        {!loading && !(profileError && !profileUser) ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="bg-primary rounded-full overflow-hidden w-16 h-16 shrink-0">
                <Image
                  src={image}
                  alt={fullName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-lg font-semibold truncate">{fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatLabel(residentType || role)}
                    {estateName !== "—" ? ` · ${estateName}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isActive != null ? (
                    <StatusPill tone={isActive ? "green" : "red"}>
                      {isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  ) : null}
                  {isVerified != null ? (
                    <StatusPill tone={isVerified ? "green" : "amber"}>
                      {isVerified ? "Verified" : "Unverified"}
                    </StatusPill>
                  ) : null}
                  {serviceCharge != null ? (
                    <StatusPill tone={serviceCharge ? "green" : "slate"}>
                      {serviceCharge
                        ? "Service charge on"
                        : "Service charge off"}
                    </StatusPill>
                  ) : null}
                  {invitationStatus ? (
                    <StatusPill tone="slate">
                      {formatLabel(invitationStatus)}
                    </StatusPill>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Personal details
                </h3>
                <DetailField
                  label="First name"
                  value={asString(display.firstName) || "—"}
                />
                <DetailField
                  label="Last name"
                  value={asString(display.lastName) || "—"}
                />
                <DetailField
                  label="Gender"
                  value={formatLabel(asString(display.gender))}
                />
                <DetailField
                  label="Date of birth"
                  value={formatDate(asString(display.dateOfBirth) || null)}
                />
                <DetailField
                  label="Resident type"
                  value={formatLabel(residentType || "Resident")}
                />
                {residentCode ? (
                  <DetailField
                    label="Resident code"
                    value={residentCode}
                    copyValue={residentCode}
                  />
                ) : null}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact & account
                </h3>
                <DetailField
                  label="Email"
                  value={email || "—"}
                  copyValue={email || undefined}
                />
                <DetailField
                  label="Phone"
                  value={phoneDisplay}
                  copyValue={phoneDisplay !== "—" ? phoneDisplay : undefined}
                />
                <DetailField label="Role" value={formatLabel(role)} />
                {asString(display.address) ? (
                  <DetailField
                    label="Address"
                    value={asString(display.address)}
                  />
                ) : null}
                <DetailField
                  label="Wallet"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {hasWallet ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {hasWallet ? "Linked" : "Not linked"}
                    </span>
                  }
                />
                <DetailField
                  label="Member since"
                  value={formatDateTime(asString(display.createdAt) || null)}
                />
                <DetailField
                  label="Last updated"
                  value={formatDateTime(asString(display.updatedAt) || null)}
                />
              </div>
            </div>

            {/* Addresses + Meter (single source of truth for meter numbers) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr] border-t border-border pt-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Addresses
                </h3>
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No addresses linked to this account.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {addresses.map((addr, index) => (
                      <div
                        key={addr.id || index}
                        className="rounded-lg border border-border p-4"
                      >
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Address {index + 1}
                        </p>
                        {addr.data && Object.keys(addr.data).length > 0 ? (
                          <dl className="space-y-1">
                            {Object.entries(addr.data).map(([key, val]) => (
                              <div
                                key={key}
                                className="flex justify-between gap-4 text-sm"
                              >
                                <dt className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </dt>
                                <dd className="font-medium text-right">
                                  {val || "—"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-sm font-medium">
                            {formatAddressLabel(addr)}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Zap className="h-3.5 w-3.5" />
                            Meter
                          </span>
                          {metersLoading ? (
                            <span className="text-muted-foreground text-xs">
                              Loading…
                            </span>
                          ) : (
                            <MeterNumberValue
                              meterNumber={meterByAddressId[addr.id] ?? null}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-primary" />
                  Estate
                </h3>
                <div className="rounded-lg border border-border p-4">
                  <DetailField label="Current estate" value={estateName} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/settings" onClick={onClose}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit in Settings
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}