"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import DropdownFilter, {
  type FilterOption,
} from "@/components/filters/DropdownFilter";
import DashboardFiltersSkeleton from "@/components/dashboard/DashboardFiltersSkeleton";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
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
  trainings: ProgramTrainingRow[] | null;
};

type TrainingRow = {
  id: string | number;
  name: string | null;
};

type DashboardProgramFiltersProps = {
  onProgramChange?: (programId: string) => void;
  onTrainingChange?: (trainingId: string) => void;
  onExerciseChange?: (exerciseId: string) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
  selectedProgramId?: string;
  selectedTrainingId?: string;
  selectedExerciseId?: string;
  exerciseOptions?: FilterOption[];
  loadingExercises?: boolean;
  showStats?: boolean;
  onShowStatsChange?: (showStats: boolean) => void;
};

export default function DashboardProgramFilters({
  onProgramChange,
  onTrainingChange,
  onExerciseChange,
  onLoadingStateChange,
  selectedProgramId = "",
  selectedTrainingId = "",
  selectedExerciseId = "",
  exerciseOptions = [],
  loadingExercises = false,
  showStats = false,
  onShowStatsChange,
}: DashboardProgramFiltersProps) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [programOptions, setProgramOptions] = useState<FilterOption[]>([]);
  const [trainingOptions, setTrainingOptions] = useState<FilterOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [hasFetchedTrainings, setHasFetchedTrainings] = useState(false);

  const selectedProgram = selectedProgramId;
  const selectedTraining = selectedTrainingId;
  const selectedExercise = selectedExerciseId;

  const isFetchingFilters =
    (loadingPrograms && programOptions.length === 0) ||
    (selectedProgram !== "" &&
      loadingTrainings &&
      trainingOptions.length === 0) ||
    (selectedTraining !== "" &&
      loadingExercises &&
      exerciseOptions.length === 0);

  const showFiltersSkeleton = useMinimumVisibility(isFetchingFilters);

  useEffect(() => {
    onLoadingStateChange?.(showFiltersSkeleton);
  }, [onLoadingStateChange, showFiltersSkeleton]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrograms = async () => {
      if (!user?.id) {
        if (isMounted) {
          setProgramOptions([]);
          setLoadingPrograms(false);
          if (selectedProgram) {
            onProgramChange?.("");
          }
        }
        return;
      }

      setLoadingPrograms(true);

      const { data, error } = await supabase
        .from("programs")
        .select("id, name, trainings ( id )")
        .eq("user_id", user.id)
        .order("position", { ascending: true })
        .returns<ProgramRow[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Erreur lors du chargement des programmes :", error.message);
        setProgramOptions([]);
        if (selectedProgram) {
          onProgramChange?.("");
        }
      } else {
        const programs = data ?? [];
        const options = programs
          .filter((program) => {
            const trainings = program.trainings ?? [];

            return trainings.some(
              (training) =>
                training?.id !== null && training?.id !== undefined,
            );
          })
          .map((program) => ({
            value: String(program.id),
            label: program.name?.trim() || FALLBACK_PROGRAM_LABEL,
          }));

        setProgramOptions(options);
      }

      setLoadingPrograms(false);
    };

    void fetchPrograms();

    return () => {
      isMounted = false;
    };
  }, [onProgramChange, selectedProgram, supabase, user?.id]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProgram) {
      setTrainingOptions([]);
      setLoadingTrainings(false);
      setHasFetchedTrainings(false);
      if (selectedTraining) {
        onTrainingChange?.("");
      }
      if (selectedExercise) {
        onExerciseChange?.("");
      }
      return () => {
        isMounted = false;
      };
    }

    const fetchTrainings = async () => {
      setLoadingTrainings(true);
      setHasFetchedTrainings(false);

      const { data, error } = await supabase
        .from("trainings")
        .select("id, name")
        .eq("program_id", selectedProgram)
        .order("position", { ascending: true })
        .returns<TrainingRow[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Erreur lors du chargement des entraînements :",
          error.message,
        );
        setTrainingOptions([]);
        if (selectedTraining) {
          onTrainingChange?.("");
        }
        if (selectedExercise) {
          onExerciseChange?.("");
        }
      } else {
        const trainings = data ?? [];
        const options = trainings.map((training) => ({
          value: String(training.id),
          label: training.name?.trim() || FALLBACK_TRAINING_LABEL,
        }));

        setTrainingOptions(options);
      }

      setHasFetchedTrainings(true);
      setLoadingTrainings(false);
    };

    void fetchTrainings();

    return () => {
      isMounted = false;
    };
  }, [
    onExerciseChange,
    onTrainingChange,
    selectedExercise,
    selectedProgram,
    selectedTraining,
    supabase,
  ]);

  useEffect(() => {
    if (loadingPrograms) {
      return;
    }

    if (
      selectedProgram &&
      !programOptions.some((option) => option.value === selectedProgram)
    ) {
      onProgramChange?.("");
    }
  }, [loadingPrograms, onProgramChange, programOptions, selectedProgram]);

  useEffect(() => {
    if (loadingTrainings || !hasFetchedTrainings) {
      return;
    }

    if (
      selectedTraining &&
      !trainingOptions.some((option) => option.value === selectedTraining)
    ) {
      onTrainingChange?.("");
    }
  }, [
    hasFetchedTrainings,
    loadingTrainings,
    onTrainingChange,
    selectedTraining,
    trainingOptions,
  ]);

  useEffect(() => {
    if (!selectedTraining && selectedExercise) {
      onExerciseChange?.("");
      return;
    }

    if (
      selectedExercise &&
      !exerciseOptions.some((option) => option.value === selectedExercise)
    ) {
      onExerciseChange?.("");
    }
  }, [exerciseOptions, onExerciseChange, selectedExercise, selectedTraining]);

  if (showFiltersSkeleton) {
    return <DashboardFiltersSkeleton className="mt-10 animate-pulse" />;
  }

  const programPlaceholder = (() => {
    if (programOptions.length === 0) {
      return loadingPrograms
        ? "Sélectionnez un programme"
        : "Aucun programme disponible";
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
  const exercisePlaceholder = (() => {
    if (!selectedTraining) {
      return "Sélectionnez un exercice";
    }

    if (loadingExercises) {
      return "Chargement des exercices...";
    }

    if (exerciseOptions.length === 0) {
      return "Aucun exercice disponible";
    }

    return "Sélectionnez un exercice";
  })();
  const isExerciseDisabled = selectedTraining === "" || loadingExercises;

  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-4 grow">
        <DropdownFilter
          label="Programme"
          placeholder={programPlaceholder}
          options={programOptions}
          selected={selectedProgram}
          onSelect={(value) => {
            onProgramChange?.(value);
            onTrainingChange?.("");
            onExerciseChange?.("");
          }}
          className="min-w-[240px]"
        />
        <DropdownFilter
          label="Entraînement"
          placeholder={trainingPlaceholder}
          options={trainingOptions}
          selected={selectedTraining}
          onSelect={(value) => {
            if (onTrainingChange) {
              onTrainingChange(value);
            }
            onExerciseChange?.("");
          }}
          className="min-w-[240px]"
          disabled={isTrainingDisabled}
        />
        <DropdownFilter
          label="Exercice"
          placeholder={exercisePlaceholder}
          options={exerciseOptions}
          selected={selectedExercise}
          onSelect={(value) => {
            if (onExerciseChange) {
              onExerciseChange(value);
            }
          }}
          className="min-w-[240px]"
          disabled={isExerciseDisabled}
          sortOptions={false}
        />
      </div>
      <button
        type="button"
        onClick={() => onShowStatsChange?.(!showStats)}
        className="ml-auto self-end h-10 min-w-[189px] border border-[#D7D4DC] rounded-[5px] px-3 flex items-center gap-2 text-[16px] font-semibold text-[#3A416F] bg-white hover:border-[#C2BFC6] transition"
        aria-pressed={showStats}
      >
        <Image
          src={showStats ? StatsRedIcon : StatsGreenIcon}
          alt=""
          width={16}
          height={16}
        />
        <span>{showStats ? "Masquer les stats" : "Afficher les stats"}</span>
      </button>
    </div>
  );
}
