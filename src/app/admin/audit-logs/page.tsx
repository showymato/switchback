import { listAuditLogs } from "@/server/queries/admin";
import { formatDateTimeIst } from "@/lib/format";
import { EmptyState, PageHeader, RowList } from "@/components/dashboard/ui";

export default async function AdminAuditLogsPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <PageHeader eyebrow="Append-only" title="Audit logs" description="Record of privileged actions taken by admins." />
      {logs.length === 0 ? (
        <EmptyState title="No audit entries yet" />
      ) : (
        <RowList>
          {logs.map(({ log, actor }) => (
            <div key={log.id} className="border-b border-border px-5 py-4 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-[2px] bg-navy px-1.5 py-0.5 font-mono text-[0.65rem] uppercase text-white">{log.action}</span>
                <span className="text-foreground">
                  {log.targetType} <span className="font-mono text-xs text-muted-foreground">{log.targetId.slice(0, 8)}</span>
                </span>
                <span className="technical-label ml-auto text-muted-foreground">
                  {actor.fullName} · {formatDateTimeIst(log.createdAt)}
                </span>
              </div>
              {Object.keys(log.metadata as object).length > 0 && (
                <pre className="mt-3 overflow-x-auto rounded-[3px] bg-dust p-3 font-mono text-xs text-foreground/80">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </RowList>
      )}
    </div>
  );
}
