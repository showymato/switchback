import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { customerProfiles, users } from "@/db/schema";
import { ProfileForm } from "@/components/account/ProfileForm";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { PageHeader, Panel } from "@/components/dashboard/ui";

export default async function ProfilePage() {
  const user = await requireUser();
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)).limit(1);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Account settings"
        title="Profile"
        description={`Signed in as ${dbUser.email}. Your details are shared with a rental partner only for bookings you make.`}
      />

      <div className="space-y-1">
        <Panel title="Personal details" eyebrow="Account">
          <ProfileForm
            fullName={dbUser.fullName}
            phone={dbUser.phone ?? ""}
            drivingLicenceNumber={profile?.drivingLicenceNumber ?? ""}
            notificationEmail={profile?.notificationEmail ?? true}
            notificationSms={profile?.notificationSms ?? true}
          />
        </Panel>

        <Panel title={<span className="text-destructive">Delete account</span>} eyebrow="Danger zone" delay={0.05}>
          <p className="text-sm text-muted-foreground">
            This flags your account for deletion. An admin will complete removal of your personal data, retaining
            only what is legally required for completed bookings.
          </p>
          {dbUser.deletionRequestedAt ? (
            <p className="mt-3 text-sm text-muted-foreground">Deletion requested. Our team will follow up by email.</p>
          ) : (
            <div className="mt-4">
              <DeleteAccountButton />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
