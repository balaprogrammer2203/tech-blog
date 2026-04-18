export type AdminReportReporter = { id: string; name: string; email: string };

export type AdminReportRow = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  reporter: AdminReportReporter | null;
};

export type AdminReportDetail = AdminReportRow;
