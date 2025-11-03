"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import DropdownFilter, {
  type FilterOption,
} from "@/components/filters/DropdownFilter";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import StatsRedIcon from "/public/icons/stats_red.svg";
import StatsGreenIcon from "/public/icons/stats_green.svg";

const FALLBACK_PROGRAM_LABEL = "Programme sans titre";
const FALLBACK_TRAINING_LABEL = "Entraînement sans titre";

type ProgramTrainingRow = {
  id: string | number | null;
};

type ProgramRow = {
  id: string | number;
  name: string | null;
  trainings?: ProgramTrainingRow[] | null;
};

type TrainingRow = {
  id: string | number;
  name: string | null;
};

type DashboardProgramFiltersProps = {
  onProgramChange?: (programId: string) => void;
  onTrainingChange?: (trainingId: string) => void;
};

export default function DashboardProgramFilters({
  onProgramChange,
  onTrainingChange,
}: DashboardProgramFiltersProps) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [programOptions, setProgramOptions] = useState<FilterOption[]>([]);
  const [trainingOptions, setTrainingOptions] = useState<FilterOption[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTraining, setSelectedTraining] = useState("");
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    onProgramChange?.(selectedProgram);
  }, [onProgramChange, selectedProgram]);

  useEffect(() => {
    onTrainingChange?.(selectedTraining);
  }, [onTrainingChange, selectedTraining]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrograms = async () => {
      if (!user?.id) {
        if (isMounted) {
          setProgramOptions([]);
          setSelectedProgram("");
          setLoadingPrograms(false);
        }
        return;
      }

      setLoadingPrograms(true);

      const { data, error } = await supabase
        .from("programs")
        .select("id, name, trainings ( id )")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Erreur lors du chargement des programmes :", error.message);
        setProgramOptions([]);
        setSelectedProgram("");
      } else {
        const options =
          (data as ProgramRow[] | null)?.filter((program) => {
            if (!program.trainings || !Array.isArray(program.trainings)) {
              return false;
            }

            return program.trainings.some((training) => {
              if (!training) {
                return false;
              }

              return training.id !== null && training.id !== undefined;
            });
          })
            .map((program) => ({
              value: String(program.id),
              label: program.name?.trim() || FALLBACK_PROGRAM_LABEL,
            })) ?? [];

        setProgramOptions(options);
      }

      setLoadingPrograms(false);
    };

    void fetchPrograms();

    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProgram) {
      setTrainingOptions([]);
      setSelectedTraining("");
      setLoadingTrainings(false);
      return () => {
        isMounted = false;
      };
    }

    const fetchTrainings = async () => {
      setLoadingTrainings(true);

      const { data, error } = await supabase
        .from("trainings")
        .select("id, name")
        .eq("program_id", selectedProgram)
        .order("position", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Erreur lors du chargement des entraînements :",
          error.message,
        );
        setTrainingOptions([]);
        setSelectedTraining("");
      } else {
        const options = (data as TrainingRow[] | null)?.map((training) => ({
          value: String(training.id),
          label: training.name?.trim() || FALLBACK_TRAINING_LABEL,
        })) ?? [];

        setTrainingOptions(options);
      }

      setLoadingTrainings(false);
    };

    void fetchTrainings();

    return () => {
      isMounted = false;
    };
  }, [supabase, selectedProgram]);

  useEffect(() => {
    if (
      selectedProgram &&
      !programOptions.some((option) => option.value === selectedProgram)
    ) {
      setSelectedProgram("");
    }
  }, [programOptions, selectedProgram]);

  useEffect(() => {
    if (
      selectedTraining &&
      !trainingOptions.some((option) => option.value === selectedTraining)
    ) {
      setSelectedTraining("");
    }
  }, [selectedTraining, trainingOptions]);

  const programPlaceholder = (() => {
    if (loadingPrograms) {
      return "Chargement...";
    }

    if (programOptions.length === 0) {
      return "Aucun programme disponible";
    }

    return "Sélectionnez un programme";
  })();

  const trainingPlaceholder = (() => {
    if (selectedProgram && loadingTrainings) {
      return "Sélectionnez un entraînement";
    }

    if (selectedProgram && trainingOptions.length === 0) {
      return "Aucun entraînement disponible";
    }

    return "Sélectionnez un entraînement";
  })();

  const isTrainingDisabled = selectedProgram === "";

  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-4 grow">
        <DropdownFilter
          label="Programme"
          placeholder={programPlaceholder}
          options={programOptions}
          selected={selectedProgram}
          onSelect={(value) => {
            setSelectedProgram(value);
            setSelectedTraining("");
          }}
          className="min-w-[240px]"
        />
        <DropdownFilter
          label="Entraînements"
          placeholder={trainingPlaceholder}
          options={trainingOptions}
          selected={selectedTraining}
          onSelect={setSelectedTraining}
          className="min-w-[240px]"
          disabled={isTrainingDisabled}
        />
      </div>
      <button
        type="button"
        onClick={() => setShowStats((current) => !current)}
        className="ml-auto h-10 min-w-[189px] border border-[#D7D4DC] rounded-[5px] px-3 flex items-center justify-center text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition"
        aria-pressed={showStats}
      >
        <div className="flex items-center gap-2">
          <Image
            src={showStats ? StatsGreenIcon : StatsRedIcon}
            alt=""
            width={16}
            height={16}
          />
          <span>Afficher les stats</span>
        </div>
      </button>
    </div>
  );
}
