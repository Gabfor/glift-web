"use client";

import { useState } from "react";
import DashboardProgramFilters from "@/components/dashboard/DashboardProgramFilters";

export default function DashboardPage() {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [, setSelectedTraining] = useState("");

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <div className="text-center">
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">
            Tableau de bord
          </h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494]">
            Sélectionnez un programme et un entraînement pour suivre
            <br />
            votre progression par exercice et vous fixer des objectifs.
          </p>
        </div>
        <DashboardProgramFilters
          onProgramChange={setSelectedProgram}
          onTrainingChange={setSelectedTraining}
        />
        {selectedProgram === "" && (
          <p className="mt-8 text-center text-[#5D6494] font-semibold">
            Aucun programme trouvé.
          </p>
        )}
      </div>
    </main>
  );
}
