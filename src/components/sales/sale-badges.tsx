import { formatDateTime } from "@/lib/labels";
import clsx from "clsx";
import { deliveryStatusLabels, salePaymentStatusLabels, saleStatusLabels, type DeliveryStatus, type SalePaymentStatus, type SaleStatus } from "@/types/sale";

const badge = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const paymentTones: Record<SalePaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-800",
  partial: "bg-amber-50 text-amber-800",
  unpaid: "bg-red-50 text-red-700",
  refund_due: "bg-violet-50 text-violet-800",
  none: "bg-gray-100 text-gray-600",
};

const deliveryTones: Record<DeliveryStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  on_the_way: "bg-sky-50 text-sky-800",
  delivered: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-700",
  returned: "bg-amber-50 text-amber-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusTones: Record<SaleStatus, string> = {
  completed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
  returned: "bg-amber-50 text-amber-800",
  partly_returned: "bg-amber-50 text-amber-800",
};

export const PaymentStatusBadge = ({ status }: { status: SalePaymentStatus }) => <span className={clsx(badge, paymentTones[status])}>{salePaymentStatusLabels[status]}</span>;

export const DeliveryStatusBadge = ({ status }: { status: DeliveryStatus }) => <span className={clsx(badge, deliveryTones[status])}>{deliveryStatusLabels[status]}</span>;

export const SaleStatusBadge = ({ status }: { status: SaleStatus }) => <span className={clsx(badge, statusTones[status])}>{saleStatusLabels[status]}</span>;

/** Ethiopian time (GMT+3), with the year */
export const formatTime = (value: string) => formatDateTime(value);
