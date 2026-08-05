"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { Plus, Edit, Trash2, Power, PowerOff, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Table from "@/components/tables/list/page";
import type { AppDispatch, RootState } from "@/redux/store";
import { CompanyStatsCards } from "./components/CompanyStatsCards";
import { CompanyFormModal } from "./components/CompanyFormModal";
import { CompanyStatusModal } from "./components/CompanyStatusModal";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import {
  activateCompany,
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyModules,
  suspendCompany,
  updateCompany,
  type CompanyItem,
  type CreateCompanyPayload,
  type CompanyModuleKey,
} from "@/redux/slice/super-admin/company-mgt/company";

const PAGE_SIZE = 10;

const MODULE_LABELS: Record<string, string> = {
  bills: "Bills",
  rent: "Rent",
  meter: "Meter",
  marketplace: "Marketplace",
  visitor: "Visitor",
  complaints: "Complaints",
  announcements: "Announcements",
  wallet: "Wallet",
  transactions: "Transactions",
  comments: "Comments",
  address: "Address",
  expense: "Expense",
  reporting: "Reporting",
  users: "Users",
};

const VISIBLE_MODULE_LIMIT = 3;

function ModulesCell({ mods }: { mods: CompanyModuleKey[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!mods.length) return <span className="text-muted-foreground">—</span>;

  const visible = mods.slice(0, VISIBLE_MODULE_LIMIT);
  const overflow = mods.slice(VISIBLE_MODULE_LIMIT);

  return (
    <div className="relative flex flex-wrap items-center gap-1" ref={ref}>
      {visible.map((m) => (
        <span
          key={m}
          className="px-2 py-0.5 rounded-full text-xs bg-muted whitespace-nowrap"
        >
          {MODULE_LABELS[m] ?? m}
        </span>
      ))}

      {overflow.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            +{overflow.length} more
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-popover shadow-md p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                All Modules ({mods.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mods.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-full text-xs bg-muted whitespace-nowrap"
                  >
                    {MODULE_LABELS[m] ?? m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function companyId(item: CompanyItem): string | undefined {
  return item.id ?? item._id;
}

type CompanyFormState = CreateCompanyPayload;

function normalizeModules(mods: unknown): CompanyModuleKey[] {
  return Array.isArray(mods)
    ? (mods.filter(Boolean) as CompanyModuleKey[])
    : [];
}

export default function SuperAdminCompanyPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { list, pagination, loading, modules, modulesLoading } = useSelector(
    (state: RootState) => {
      const s: any = (state as any).superAdminCompany;
      return {
        list: (s?.list ?? []) as CompanyItem[],
        pagination: s?.pagination ?? null,
        loading: isPending(s?.getListStatus),
        modules: (s?.modules ?? []) as CompanyModuleKey[],
        modulesLoading: s?.getModulesStatus === "isLoading",
      };
    },
  );

  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(
    null,
  );
  const [statusItem, setStatusItem] = useState<CompanyItem | null>(null);
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">(
    "suspend",
  );
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CompanyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [form, setForm] = useState<CompanyFormState>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    isActive: true,
    modules: [],
  });

  const effectivePageSize = Number(pagination?.pageSize) || PAGE_SIZE;

  useEffect(() => {
    if (!open) return;
    dispatch(getCompanyModules())
      .unwrap()
      .catch((err: any) =>
        toast.error(err?.message ?? "Failed to fetch available modules"),
      );
  }, [dispatch, open]);

  const fetchList = useCallback(
    (targetPage: number) => {
      const shouldApplyDate = Boolean(startDate && endDate);
      return dispatch(
        getCompanies({
          page: targetPage,
          limit: effectivePageSize,
          search: searchQuery.trim() || undefined,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      )
        .unwrap()
        .catch((err: any) =>
          toast.error(err?.message ?? "Failed to fetch companies"),
        );
    },
    [dispatch, effectivePageSize, searchQuery, startDate, endDate],
  );

  useEffect(() => {
    setPage(1);
    fetchList(1);
  }, [fetchList]);

  const applySearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (!value.trim() && searchQuery) {
      setSearchQuery("");
      setPage(1);
    }
  };

  const openCreate = () => {
    setEditingCompany(null);
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      isActive: true,
      modules: [],
    });
    setOpen(true);
  };

  const openEdit = (item: CompanyItem) => {
    setEditingCompany(item);
    setForm({
      name: item.name ?? "",
      address: item.address ?? "",
      city: item.city ?? "",
      state: item.state ?? "",
      country: item.country ?? "",
      isActive: Boolean(item.isActive),
      modules: normalizeModules(item.modules),
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingCompany(null);
  };

  const closeStatusModal = () => {
    if (statusSubmitting) return;
    setStatusItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modules.length) {
      toast.error("Select at least one module");
      return;
    }
    try {
      const id = editingCompany ? companyId(editingCompany) : undefined;
      if (id) {
        await dispatch(updateCompany({ id, data: form })).unwrap();
        toast.success("Company updated successfully!");
      } else {
        await dispatch(createCompany(form)).unwrap();
        toast.success("Company created successfully!");
      }
      closeModal();
      setPage(1);
      await fetchList(1);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save company");
    }
  };

  const openSuspendModal = (item: CompanyItem) => {
    setStatusItem(item);
    setStatusMode("suspend");
  };

  const openActivateModal = (item: CompanyItem) => {
    setStatusItem(item);
    setStatusMode("activate");
  };

  const handleConfirmStatus = async () => {
    const item = statusItem;
    if (!item) return;
    const id = companyId(item);
    if (!id) return;
    setStatusSubmitting(true);
    try {
      if (statusMode === "suspend") {
        await dispatch(suspendCompany(id)).unwrap();
        toast.info(`${item.name ?? "Company"} suspended.`);
      } else {
        await dispatch(activateCompany(id)).unwrap();
        toast.success(`${item.name ?? "Company"} activated.`);
      }
      closeStatusModal();
      setPage(1);
      await fetchList(1);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update company status.");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDelete = async (item: CompanyItem) => {
    const id = companyId(item);
    if (!id) return;
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = companyId(itemToDelete);
    if (!id) return;
    setDeleting(true);
    try {
      await dispatch(deleteCompany(id)).unwrap();
      toast.success(`${itemToDelete.name ?? "Company"} deleted successfully!`);
      setItemToDelete(null);
      setPage(1);
      await fetchList(1);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to delete company.");
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created At",
        render: (item: CompanyItem) =>
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
        exportValue: (item: CompanyItem) => item.createdAt ?? "",
      },
      { key: "name", header: "Company Name" },
      { key: "address", header: "Address" },
      { key: "city", header: "City" },
      { key: "state", header: "State" },
      { key: "country", header: "Country" },
      {
        key: "isActive",
        header: "Status",
        render: (item: CompanyItem) => (
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700",
            )}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        ),
        exportValue: (item: CompanyItem) =>
          item.isActive ? "Active" : "Inactive",
      },
      {
        key: "modules",
        header: "Modules",
        render: (item: CompanyItem) => (
          <ModulesCell mods={normalizeModules(item.modules)} />
        ),
        exportValue: (item: CompanyItem) =>
          normalizeModules(item.modules).join("|"),
      },
      {
        key: "actions",
        header: "Actions",
        exportable: false,
        render: (item: CompanyItem) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(item)}
              title="Edit Company"
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>

            {item.isActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openSuspendModal(item)}
                title="Suspend Company"
                className="cursor-pointer"
              >
                <PowerOff className="w-4 h-4 text-red-600" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openActivateModal(item)}
                title="Activate Company"
                className="cursor-pointer"
              >
                <Power className="w-4 h-4 text-green-600" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item)}
              title="Delete Company"
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modules],
  );

  const emptyMessage = "No companies found.";

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading companies..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Company Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage companies, including enabled modules.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Company
          </Button>
        </div>

        <CompanyStatsCards
          companies={list ?? []}
          total={pagination?.total ?? 0}
        />

        <Card className="p-4">
          <div className="relative w-full max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search by company name, address, city etc..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                  if (e.key === "Escape") clearSearch();
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {searchInput.trim().length > 0 && (
              <Button type="button" onClick={applySearch} className="cursor-pointer">
                Search
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <Table
            columns={columns as any}
            data={list ?? []}
            emptyMessage={emptyMessage}
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate, endDate }) => {
              setStartDate(startDate);
              setEndDate(endDate);
              setPage(1);
            }}
            showPagination
            paginationInfo={{
              total: pagination?.total ?? 0,
              current: pagination?.currentPage ?? page,
              pageSize: pagination?.pageSize ?? effectivePageSize,
            }}
            onPageChange={(p) => {
              setPage(p);
              fetchList(p);
            }}
            enableExport
            exportFileName="companies"
            onExportRequest={async () => {
              const shouldApplyDate = Boolean(startDate && endDate);
              const res: any = await dispatch(
                getCompanies({
                  page: 1,
                  limit: 99999,
                  search: searchQuery.trim() || undefined,
                  startDate: shouldApplyDate ? startDate : undefined,
                  endDate: shouldApplyDate ? endDate : undefined,
                }),
              ).unwrap();
              return (res?.data ?? []) as CompanyItem[];
            }}
          />
        </Card>

        <CompanyFormModal
          open={open}
          onClose={closeModal}
          mode={editingCompany ? "update" : "create"}
          form={form}
          setForm={setForm}
          modules={modules}
          modulesLoading={modulesLoading}
          onSubmit={handleSubmit}
        />

        <CompanyStatusModal
          visible={Boolean(statusItem)}
          onClose={closeStatusModal}
          companyName={statusItem?.name ?? "this company"}
          mode={statusMode}
          loading={statusSubmitting}
          onConfirm={handleConfirmStatus}
        />
      </div>
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name ?? "this company"}
        title="Delete company"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
