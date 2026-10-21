"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
  toDateInputValue,
  todayDateInput,
  type MarketplaceAudience,
} from "@/lib/marketplace";
import { listingImages, listingVideos } from "@/lib/marketplace-media";
import { MarketplaceEstatePicker } from "@/components/marketplace/MarketplaceEstatePicker";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  getMarketplaceEstates,
  type CreateMarketplacePayload,
  type MarketplaceAd,
  type MarketplaceTargetEstate,
} from "@/redux/slice/marketplace/marketplace";
import type { AppDispatch, RootState } from "@/redux/store";
import { cn } from "@/lib/utils";
import type { EstateOption } from "@/components/marketplace/MarketplaceEstatePicker";

const PRESS = MARKETPLACE_PRESS;

function submitLabel(loading: boolean, editing: boolean, isSuperAdmin: boolean) {
  if (loading) return "Saving…";
  if (editing) return "Save listing";
  if (isSuperAdmin) return "Post listing";
  return "Submit for approval";
}

function FormStatusNote({
  isSuperAdmin,
  editingActive,
}: Readonly<{ isSuperAdmin: boolean; editingActive: boolean }>) {
  if (isSuperAdmin) return null;
  if (editingActive) {
    return (
      <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
        Saving an active ad sends it back for approval before it appears in the
        feed again.
      </p>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      New ads stay hidden until the Bertahub Review Team approves them.
    </p>
  );
}

function estateLabel(item: MarketplaceTargetEstate): string {
  const name = item.name?.trim() || "Unnamed estate";
  const place = [item.city, item.state, item.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  return place ? `${name} · ${place}` : name;
}

function mapTargetEstates(rows: MarketplaceTargetEstate[]): EstateOption[] {
  return rows
    .map((item) => {
      const value = String(item.id || item._id || "").trim();
      if (!value) return null;
      return { label: estateLabel(item), value };
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
  const isSuperAdmin = role === "super admin";

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
  const [mediaBusy, setMediaBusy] = useState(false);

  const targetEstates = useSelector(
    (state: RootState) => state.marketplace.targetEstates,
  );
  const estateOptions = useMemo(
    () => mapTargetEstates(targetEstates),
    [targetEstates],
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
    dispatch(getMarketplaceEstates({ page: 1, limit: 200 })).catch(() => {});
  }, [audience, dispatch]);

  const searchEstates = useCallback(
    (query: string) => {
      dispatch(
        getMarketplaceEstates({
          page: 1,
          limit: 200,
          search: query || undefined,
        }),
      ).catch(() => {});
    },
    [dispatch],
  );

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
      <FormStatusNote
        isSuperAdmin={isSuperAdmin}
        editingActive={editingActive}
      />

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
            onSearch={searchEstates}
            disabled={loading}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Media</h2>
        <p className="text-sm text-muted-foreground">
          Up to {MARKETPLACE_MAX_IMAGES} photos and {MARKETPLACE_MAX_VIDEOS}{" "}
          videos in one place.
        </p>
        <MarketplaceMediaPicker
          images={images}
          videos={videos}
          maxImages={MARKETPLACE_MAX_IMAGES}
          maxVideos={MARKETPLACE_MAX_VIDEOS}
          disabled={loading}
          onImagesChange={setImages}
          onVideosChange={setVideos}
          onBusyChange={setMediaBusy}
        />
      </section>

      <div>
        <Label htmlFor="ad-notes">Notes</Label>
        <textarea
          id="ad-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={
            isSuperAdmin ? "Note" : "Note for reviewers"
          }
          className="mt-1 flex w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn("h-12 flex-1 rounded-xl", PRESS)}
        >
          {submitLabel(loading, Boolean(initialData?.id), isSuperAdmin)}
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
