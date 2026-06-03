import type { OccupancyDistributionData } from "@/components/charts/occupancy-distribution-donut-card";
import type { ResidentTypeBreakdownData } from "@/redux/slice/admin/user-analytics/user-analytics";

export function mapResidentTypeBreakdownToChartData(
  breakdown: ResidentTypeBreakdownData,
): OccupancyDistributionData {
  const ownerTotal = Math.max(0, breakdown.owner.total);
  const tenantTotal = Math.max(0, breakdown.tenant.total);
  const totalResidents = ownerTotal + tenantTotal;

  if (totalResidents === 0) {
    return {
      totalResidents: 0,
      occupiedPercentage: 0,
      vacantPercentage: 0,
    };
  }

  return {
    totalResidents,
    occupiedPercentage: Math.round((ownerTotal / totalResidents) * 100),
    vacantPercentage: Math.round((tenantTotal / totalResidents) * 100),
  };
}
