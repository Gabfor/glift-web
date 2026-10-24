"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DropdownFilter, {
  type FilterOption,
} from "@/components/filters/DropdownFilter";
import { createClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";

const FALLBACK_PROGRAM_LABEL = "Programme sans titre";
const FALLBACK_TRAINING_LABEL = "Entraînement sans titre";

type ProgramRow = {
  id: string | number;
  name: string | null;
  dashboard: boolean | null;
  trainings: Array<{ id: string | number | null }> | null;
};

type TrainingRow = {
  id: string | number;
  name: string | null;
  dashboard: boolean | null;
};

export interface DashboardProgramFiltersProps {
  onProgramChange?: (programId: string) => void;
  onTrainingChange?: (trainingId: string) => void;
  onExerciseChange?: (exerciseId: string) => void;
  selectedProgramId?: string;
  selectedTrainingId?: string;
  selectedExerciseId?: string;
  exerciseOptions?: FilterOption[];
  loadingExercises?: boolean;
  hasFetchedExercises?: boolean;
  showStats?: boolean;
  onShowStatsChange?: (showStats: boolean) => void;
  onProgramsLoadingChange?: (isLoading: boolean) => void;
  onProgramOptionsChange?: (options: FilterOption[]) => void;
  onFiltersLoadingChange?: (isLoading: boolean) => void;
}

export default function DashboardProgramFilters(
  props: DashboardProgramFiltersProps,
) {
  const {
    onProgramChange,
    onTrainingChange,
    onExerciseChange,
    selectedProgramId = "",
    selectedTrainingId = "",
    selectedExerciseId = "",
    exerciseOptions = [],
    loadingExercises = false,
    hasFetchedExercises = false,
    showStats = false,
    onShowStatsChange,
    onProgramsLoadingChange,
    onProgramOptionsChange,
    onFiltersLoadingChange,
  } = props;
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [programOptions, setProgramOptions] = useState<FilterOption[]>([]);
  const [trainingOptions, setTrainingOptions] = useState<FilterOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [hasFetchedTrainings, setHasFetchedTrainings] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const selectedProgram = selectedProgramId;
  const selectedTraining = selectedTrainingId;
  const selectedExercise = selectedExerciseId;

  // Latest callbacks/selections kept in refs so that data-fetching effects
  // don't re-run (and disable the dropdowns) each time the parent re-renders
  // with new inline callbacks.
  const latestRef = useRef({
    onProgramChange,
    onTrainingChange,
    onExerciseChange,
    onProgramOptionsChange,
    onProgramsLoadingChange,
    selectedProgram,
    selectedTraining,
    selectedExercise,
  });
  latestRef.current = {
    onProgramChange,
    onTrainingChange,
    onExerciseChange,
    onProgramOptionsChange,
    onProgramsLoadingChange,
    selectedProgram,
    selectedTraining,
    selectedExercise,
  };

  const hasInitialSelections =
    selectedProgram !== "" ||
    selectedTraining !== "" ||
    selectedExercise !== "";

  const shouldShowFiltersSkeleton =
    !hasUserInteracted &&
    hasInitialSelections &&
    ((loadingPrograms && programOptions.length === 0) ||
      (selectedProgram !== "" &&
        loadingTrainings &&
        trainingOptions.length === 0) ||
      (selectedTraining !== "" &&
        loadingExercises &&
        exerciseOptions.length === 0));

  useEffect(() => {
    onFiltersLoadingChange?.(shouldShowFiltersSkeleton);
  }, [onFiltersLoadingChange, shouldShowFiltersSkeleton]);

  useEffect(() => {
    setHasUserInteracted(false);
  }, [user?.id]);

  const markUserInteraction = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  const updateProgramOptions = useCallback((nextOptions: FilterOption[]) => {
    setProgramOptions(nextOptions);
    latestRef.current.onProgramOptionsChange?.(nextOptions);
  }, []);

  const updateProgramsLoadingState = useCallback((isLoading: boolean) => {
    setLoadingPrograms(isLoading);
    latestRef.current.onProgramsLoadingChange?.(isLoading);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPrograms = async () => {
      if (!user?.id) {
        if (isMounted) {
          updateProgramOptions([]);
          updateProgramsLoadingState(false);
          if (latestRef.current.selectedProgram) {
            latestRef.current.onProgramChange?.("");
          }
        }
        return;
      }

      updateProgramsLoadingState(true);

      const { data, error } = await supabase
        .from("programs")
        .select("id, name, dashboard, trainings ( id )")
        .eq("user_id", user.id)
        .order("position", { ascending: true })
        .returns<ProgramRow[]>();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Erreur lors du chargement des programmes :", error.message);
        updateProgramOptions([]);
        if (latestRef.current.selectedProgram) {
          latestRef.current.onProgramChange?.("");
        }
      } else {
        const programs = data ?? [];
        const options = programs
          .filter((program) => {
            const trainings = program.trainings ?? [];

            const hasTrainings = trainings.some(
              (training) =>
                training &&
                training.id !== null &&
                training.id !== undefined,
            );

            return program.dashboard !== false && hasTrainings;
          })
          .map((program) => ({
            value: String(program.id),
            label: program.name?.trim() || FALLBACK_PROGRAM_LABEL,
          }));

        updateProgramOptions(options);
      }

      updateProgramsLoadingState(false);
    };

    void fetchPrograms();

    return () => {
      isMounted = false;
    };
  }, [supabase, updateProgramOptions, updateProgramsLoadingState, user?.id]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedProgram) {
      setTrainingOptions([]);
      setLoadingTrainings(false);
      setHasFetchedTrainings(false);
      if (latestRef.current.selectedTraining) {
        latestRef.current.onTrainingChange?.("");
      }
      if (latestRef.current.selectedExercise) {
        latestRef.current.onExerciseChange?.("");
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
        .select("id, name, dashboard")
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
        if (latestRef.current.selectedTraining) {
          latestRef.current.onTrainingChange?.("");
        }
        if (latestRef.current.selectedExercise) {
          latestRef.current.onExerciseChange?.("");
        }
      } else {
        const trainings = data ?? [];
        const options = trainings
          .filter((training) => training.dashboard !== false)
          .map((training) => ({
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
  }, [selectedProgram, supabase]);

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
    if (!selectedTraining) {
      if (selectedExercise) {
        onExerciseChange?.("");
      }
      return;
    }

    if (!hasFetchedExercises) {
      return;
    }

    if (
      selectedExercise &&
      !exerciseOptions.some((option) => option.value === selectedExercise)
    ) {
      onExerciseChange?.("");
    }
  }, [
    exerciseOptions,
    hasFetchedExercises,
    onExerciseChange,
    selectedExercise,
    selectedTraining,
  ]);

  const programPlaceholder = (() => {
    if (programOptions.length === 0) {
      return loadingPrograms
        ? "Sélectionne un programme"
        : "Aucun programme disponible";
    }

    return "Sélectionne un programme";
  })();

  const isProgramDisabled = programOptions.length === 0;

  const trainingPlaceholder = (() => {
    if (selectedProgram && loadingTrainings) {
      return "Sélectionne un entraînement";
    }

    if (selectedProgram && trainingOptions.length === 0) {
      return "Aucun entraînement disponible";
    }

    return "Sélectionne un entraînement";
  })();

  const isTrainingDisabled = selectedProgram === "" || loadingTrainings || trainingOptions.length === 0;
  const exercisePlaceholder = (() => {
    if (!selectedTraining) {
      return "Sélectionne un exercice";
    }

    if (loadingExercises) {
      return "Sélectionne un exercice";
    }

    if (exerciseOptions.length === 0) {
      return "Aucun exercice disponible";
    }

    return "Sélectionne un exercice";
  })();
  const isExerciseDisabled = selectedTraining === "" || loadingExercises || exerciseOptions.length === 0;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 w-full">
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 grow w-full">
        <DropdownFilter
          label="Programme"
          placeholder={programPlaceholder}
          options={programOptions}
          selected={selectedProgram}
          onSelect={(value) => {
            markUserInteraction();
            onProgramChange?.(value);
            onTrainingChange?.("");
            onExerciseChange?.("");
          }}
          className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-[270px]"
          disabled={isProgramDisabled}
          maxWidth={270}
          sortOptions={false}
          isMultiSelect={false}
          fullWidthResponsive
        />
        <DropdownFilter
          label="Entraînement"
          placeholder={trainingPlaceholder}
          options={trainingOptions}
          selected={selectedTraining}
          onSelect={(value) => {
            markUserInteraction();
            if (onTrainingChange) {
              onTrainingChange(value);
            }
            onExerciseChange?.("");
          }}
          className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-[270px]"
          disabled={isTrainingDisabled}
          maxWidth={270}
          sortOptions={false}
          isMultiSelect={false}
          fullWidthResponsive
        />
        <DropdownFilter
          label="Exercice"
          placeholder={exercisePlaceholder}
          options={exerciseOptions}
          selected={selectedExercise}
          onSelect={(value) => {
            markUserInteraction();
            if (onExerciseChange) {
              onExerciseChange(value);
            }
          }}
          className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-[270px]"
          disabled={isExerciseDisabled}
          sortOptions={false}
          maxWidth={270}
          isMultiSelect={false}
          fullWidthResponsive
        />
      </div>
    </div>
  );
}
