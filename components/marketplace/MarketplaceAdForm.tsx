"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MarketplaceMediaPicker } from "@/components/marketplace/MarketplaceMediaPicker";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_MAX_IMAGES,
  MARKETPLACE_MAX_VIDEOS,
  MARKETPLACE_PRESS,
  audiencesForRole,
  defaultAudienceForRole,
  ensureHttpUrl,
  marketplaceAudienceLabel,
  normalizeMarketplaceStatus,
  plusDaysDateInput,
  resolveEstateId,
  toDateInputValue,
  todayDateInput,
  type MarketplaceAudience,
} from "@/lib/marketplace";
import { listingImages, listingVideos } from "@/lib/marketplace-media";
import { MarketplaceEstatePicker } from "@/components/marketplace/MarketplaceEstatePicker";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { getEnergyProviderEstates } from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate";
import type {
  CreateMarketplacePayload,
  MarketplaceAd,
} from "@/redux/slice/marketplace/marketplace";
import type { AppDispatch, RootState } from "@/redux/store";
import { cn } from "@/lib/utils";
import type { EstateOption } from "@/components/marketplace/MarketplaceEstatePicker";

const PRESS = MARKETPLACE_PRESS;

function submitLabel(loading: boolean, editing: boolean) {
  if (loading) return "Saving…";
  if (editing) return "Save listing";
  return "Submit for approval";
}

function estateSourceRows(
  isCompany: boolean,
  isEnergyProvider: boolean,
  companyEstates: unknown,
  energyProviderEstates: unknown,
  superAdminEstates: unknown,
) {
  if (isCompany) return companyEstates;
  if (isEnergyProvider) return energyProviderEstates;
  return superAdminEstates;
}

function mapEstates(rows: unknown): EstateOption[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const item = row as { id?: string; _id?: string; name?: string };
      const value = String(item._id || item.id || "").trim();
      if (!value) return null;
      return { label: item.name ?? "Unnamed estate", value };
    })
    .filter((row): row is EstateOption => Boolean(row));
}

export type MarketplaceAdFormProps = Readonly<{
  initialData?: MarketplaceAd | null;
  loading?: boolean;
  onSubmit: (payload: CreateMarketplacePayload) => void | Promise<void>;
  onCancel: () => void;
}>;

export function MarketplaceAdForm({
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: MarketplaceAdFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector(selectUserRole);
  const user = useSelector((state: RootState) => state.auth.user);
  const currentEstateId = resolveEstateId(user?.estateId);
  const isCompany = role === "company";
  const isEnergyProvider = role === "energy provider";

  const [companyName, setCompanyName] = useState("");
  const [link, setLink] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [startDate, setStartDate] = useState(todayDateInput());
  const [endDate, setEndDate] = useState(plusDaysDateInput(30));
  const [audience, setAudience] = useState<MarketplaceAudience>(
    defaultAudienceForRole(role),
  );
  const [targetEstateIds, setTargetEstateIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const mediaBusy = imageBusy || videoBusy;
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);

  const superAdminEstates = useSelector(
    (state: RootState) => state.estate.allEstates?.data ?? [],
  );
  const companyEstates = useSelector(
    (state: RootState) => state.companyEstate.allEstates?.data ?? [],
  );
  const energyProviderEstates = useSelector(
    (state: RootState) => state.energyProviderEstate.allEstates?.data ?? [],
  );

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName ?? "");
      setLink(initialData.link ?? "");
      setProductName(initialData.productName ?? "");
      setProductCategory(initialData.productCategory ?? "");
      setProductDescription(initialData.productDescription ?? "");
      setStartDate(toDateInputValue(initialData.startDate) || todayDateInput());
      setEndDate(toDateInputValue(initialData.endDate) || plusDaysDateInput(30));
      const allowed = audiencesForRole(role);
      const rawAudience =
        typeof initialData.audience === "string"
          ? initialData.audience.toUpperCase()
          : "";
      const nextAudience = allowed.includes(rawAudience as MarketplaceAudience)
        ? (rawAudience as MarketplaceAudience)
        : defaultAudienceForRole(role);
      setAudience(nextAudience);
      setTargetEstateIds(initialData.targetEstateIds ?? []);
      setNotes(initialData.notes ?? "");
      setImages(listingImages(initialData));
      setVideos(listingVideos(initialData));
      return;
    }
    setCompanyName("");
    setLink("");
    setProductName("");
    setProductCategory("");
    setProductDescription("");
    setStartDate(todayDateInput());
    setEndDate(plusDaysDateInput(30));
    setAudience(defaultAudienceForRole(role));
    setTargetEstateIds([]);
    setNotes("");
    setImages([]);
    setVideos([]);
  }, [initialData, role]);

  useEffect(() => {
    if (audience !== "OTHER_ESTATES") return;
    if (isCompany) {
      dispatch(getCompanyEstates({ page: 1, limit: 200 })).catch(() => {});
      return;
    }
    if (isEnergyProvider) {
      dispatch(getEnergyProviderEstates({ page: 1, limit: 200 })).catch(() => {});
      return;
    }
    dispatch(getAllEstates({ page: 1, limit: 200 })).catch(() => {});
  }, [audience, dispatch, isCompany, isEnergyProvider]);

  useEffect(() => {
    const rows = estateSourceRows(
      isCompany,
      isEnergyProvider,
      companyEstates,
      energyProviderEstates,
      superAdminEstates,
    );
    setEstateOptions(
      mapEstates(rows).filter((option) => option.value !== currentEstateId),
    );
  }, [
    companyEstates,
    currentEstateId,
    energyProviderEstates,
    isCompany,
    isEnergyProvider,
    superAdminEstates,
  ]);

  const audienceOptions = audiencesForRole(role);
  const editingActive =
    normalizeMarketplaceStatus(initialData?.status) === "ACTIVE";

  const canSubmit = useMemo(() => {
    if (
      !companyName.trim() ||
      !productName.trim() ||
      !productCategory.trim() ||
      !productDescription.trim() ||
      !link.trim() ||
      !startDate ||
      !endDate
    ) {
      return false;
    }
    if (endDate < startDate) return false;
    if (audience === "OTHER_ESTATES" && targetEstateIds.length === 0) {
      return false;
    }
    return !mediaBusy && !loading;
  }, [
    audience,
    companyName,
    endDate,
    link,
    loading,
    mediaBusy,
    productCategory,
    productDescription,
    productName,
    startDate,
    targetEstateIds.length,
  ]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    let url: string;
    try {
      url = ensureHttpUrl(link);
      new URL(url);
    } catch {
      toast.error("Enter a valid website link.");
      return;
    }

    const payload: CreateMarketplacePayload = {
      companyName: companyName.trim(),
      productName: productName.trim(),
      link: url,
      productCategory: productCategory.trim(),
      productDescription: productDescription.trim(),
      startDate,
      endDate,
      audience,
      images,
      videos,
    };
    if (images[0]) payload.image = images[0];
    if (audience === "OTHER_ESTATES") payload.targetEstateIds = targetEstateIds;
    if (notes.trim()) payload.notes = notes.trim();
    await onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {editingActive ? (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          Saving an active ad sends it back for approval before it appears in
          the feed again.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          New ads stay hidden until a super admin approves them.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Business</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="ad-company">Company name</Label>
            <Input
              id="ad-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 h-11"
              placeholder="Acme Supplies"
            />
          </div>
          <div>
            <Label htmlFor="ad-link">Website</Label>
            <Input
              id="ad-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1 h-11"
              placeholder="https://example.com/product"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Listing</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="ad-product">Product name</Label>
            <Input
              id="ad-product"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-1 h-11"
              placeholder="Solar kit"
            />
          </div>
          <div>
            <Label htmlFor="ad-category">Category</Label>
            <Select
              id="ad-category"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              options={[
                { label: "Select category", value: "" },
                ...MARKETPLACE_CATEGORIES.map((category) => ({
                  label: category,
                  value: category,
                })),
              ]}
              className="mt-1 h-11"
            />
          </div>
          <div>
            <Label htmlFor="ad-description">Description</Label>
            <textarea
              id="ad-description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              placeholder="What are you offering?"
              className="mt-1 flex w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Schedule</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ad-start">Start date</Label>
            <Input
              id="ad-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-11"
            />
          </div>
          <div>
            <Label htmlFor="ad-end">End date</Label>
            <Input
              id="ad-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-11"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Audience</h2>
        <div className={cn("grid gap-2", audienceOptions.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {audienceOptions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAudience(value)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-sm",
                PRESS,
                audience === value
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50",
              )}
            >
              {marketplaceAudienceLabel(value)}
            </button>
          ))}
        </div>
        {audience === "OTHER_ESTATES" ? (
          <MarketplaceEstatePicker
            options={estateOptions}
            value={targetEstateIds}
            onChange={setTargetEstateIds}
            disabled={loading}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Photos</h2>
        <p className="text-sm text-muted-foreground">
          Up to {MARKETPLACE_MAX_IMAGES} photos. Files upload to storage, not as
          base64.
        </p>
        <MarketplaceMediaPicker
          kind="image"
          urls={images}
          maxFiles={MARKETPLACE_MAX_IMAGES}
          disabled={loading}
          onChange={setImages}
          onBusyChange={setImageBusy}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Videos</h2>
        <p className="text-sm text-muted-foreground">
          Optional. Up to {MARKETPLACE_MAX_VIDEOS} clips, MP4 or WebM, 10MB each.
        </p>
        <MarketplaceMediaPicker
          kind="video"
          urls={videos}
          maxFiles={MARKETPLACE_MAX_VIDEOS}
          disabled={loading}
          onChange={setVideos}
          onBusyChange={setVideoBusy}
        />
      </section>

      <div>
        <Label htmlFor="ad-notes">Notes</Label>
        <textarea
          id="ad-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional note for reviewers"
          className="mt-1 flex w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn("h-12 flex-1 rounded-xl", PRESS)}
        >
          {submitLabel(loading, Boolean(initialData?.id))}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className={cn("h-12 rounded-xl", PRESS)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
