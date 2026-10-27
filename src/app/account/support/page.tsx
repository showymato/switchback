import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { supportCases } from "@/db/schema";
import { NewSupportCaseForm } from "@/components/account/NewSupportCaseForm";
import { EmptyState, PageHeader, Panel, Row, StatusBadge } from "@/components/dashboard/ui";
import { formatDateTimeIst, titleCase } from "@/lib/format";

export default async function SupportPage() {
  const user = await requireUser();
  const cases = await db
    .select()
    .from(supportCases)
    .where(eq(supportCases.createdByUserId, user.id))
    .orderBy(desc(supportCases.createdAt));

  return (
    <div>
      <PageHeader
        eyebrow="Help desk"
        title="Support"
        description="Open a case for booking, payment, refund, or safety issues. Serious safety incidents should also be reported immediately to local emergency services."
      />

      <div className="grid gap-1 lg:grid-cols-2">
        <Panel title="Open a new case" eyebrow="New">
          <NewSupportCaseForm />
        </Panel>

        {cases.length === 0 ? (
          <EmptyState title="No support cases yet" body="Cases you open will appear here with their status." />
        ) : (
          <Panel title="Your cases" eyebrow={`${cases.length} total`} bodyClassName="p-0" delay={0.05}>
            {cases.map((c) => (
              <Row
                key={c.id}
                title={c.subject}
                meta={`${c.caseNumber} · ${titleCase(c.category)} · ${formatDateTimeIst(c.createdAt)}`}
                aside={<StatusBadge status={c.status} />}
              />
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
