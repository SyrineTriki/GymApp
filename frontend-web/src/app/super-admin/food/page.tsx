"use client";

import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { FoodDatabasePanel } from "@/components/food-database-panel";

export default function SuperAdminFoodPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Food Database">
        <FoodDatabasePanel />
      </SuperShell>
    </RequireRole>
  );
}
