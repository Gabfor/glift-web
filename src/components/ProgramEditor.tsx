"use client";

import { useRef, useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react"; // Utilise ce hook pour accéder à supabase
import Tooltip from "@/components/Tooltip";

interface ProgramEditorProps {
  name: string;
  index: number;
  editingIndex: number | null;
  onChangeName: (index: number, newName: string) => void;
  onSubmit: (index: number) => void;
  onStartEdit: (index: number) => void;
  onCancel: () => void;
  onDelete: () => void;
  programId: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onTrainingChange?: () => void;
  isFirst: boolean;
  isLastActive: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  zIndex?: number; 
  tableName: string;
  programsTableName: string;
  adminMode?: boolean;
  isNew?: boolean
}

export default function ProgramEditor({
  name,
  index,
  editingIndex,
  onChangeName,
  onSubmit,
  onStartEdit,
  onCancel,
  onDelete,
  programId,
  isVisible,
  onToggleVisibility,
  onTrainingChange,
  isFirst,
  isLastActive,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  tableName,
  programsTableName,
  zIndex = 1,
  adminMode,
  isNew = false,
}: ProgramEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Accéder à supabase via le hook useSupabaseClient
  const supabase = useSupabaseClient();
  const { moveTrainingToAnotherProgram } = require("@/hooks/usePrograms").default();

  const [isEyeVisible, setIsEyeVisible] = useState(isVisible);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        return;
      }
      setUserId(data?.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
  fetchTrainingsData();
  }, [refreshTrigger]);

  const handleDrop = async (trainingId: string, fromProgramId: string, toProgramId: string, position: number) => {
    console.log("📦 DROP", { trainingId, fromProgramId, toProgramId, position });
    if (fromProgramId === toProgramId) return;

    await moveTrainingToAnotherProgram(trainingId, fromProgramId, toProgramId, position);
    await fetchTrainingsData();

    if (onTrainingChange) {
      onTrainingChange();
    }
  };

  const [hovered, setHovered] = useState<string | null>(null);
  const [trainingsData, setTrainingsData] = useState<any[]>([]);  // Stocker les données des entraînements

  useEffect(() => {
    console.log("🔥 useEffect triggered (ligne 51)");
      if (editingIndex === index && inputRef.current) {
        inputRef.current.focus();
      }
      fetchTrainingsData();  // Récupérer les entraînements associés au programme au démarrage
    }, [editingIndex, index]);

    useEffect(() => {
    const channel = new BroadcastChannel("glift-refresh");
    channel.onmessage = (event) => {
      if (event.data === `refresh-${programId}`) {
        fetchTrainingsData();
      }
    };
    return () => channel.close();
  }, [programId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(index);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  // Fonction pour basculer l'œil
  const handleEyeClick = () => {
    setIsEyeVisible((prev) => !prev);
    onToggleVisibility();  // Gérer la visibilité dans le parent
  };

  // Fonction pour vérifier les entraînements associés
const fetchTrainingsData = async () => {
  if (!programId || programId === "xxx") {
    setTrainingsData([]);
    return;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("id, name, program_id, position, app, dashboard")
    .eq("program_id", programId);

  if (error) {
    console.error("Erreur lors de la récupération des entraînements :", error);
    return;
  }

  if (!data) {
    console.error("❌ Aucune donnée retournée pour programId =", programId);
    return;
  }

  setTrainingsData(data);
};

  // Fonction pour supprimer un programme depuis Supabase
  const handleDelete = async (programId: string) => {
    try {
      // Suppression des entraînements associés au programme
      const { data: trainingsData, error: trainingsError } = await supabase
        .from(tableName)
        .delete()
        .eq("program_id", programId);

      if (trainingsError) {
        throw new Error(trainingsError.message);
      }

      console.log("Entraînements supprimés avec succès", trainingsData);

      // Suppression du programme après avoir supprimé les entraînements
      const { data, error } = await supabase
        .from(programsTableName)
        .delete()
        .eq("id", programId);

      if (error) {
        throw new Error(error.message);
      }

      console.log("Programme supprimé avec succès", data);
      onDelete();  // Appeler la fonction onDelete (optionnel, si tu veux mettre à jour l'état local après suppression)
    } catch (error) {
      console.error("Erreur lors de la suppression du programme et des entraînements", error);
    }
  };

  // Fonction qui désactive la suppression si le programme n'a pas d'entraînements associés
  const handleDeleteClick = async (programId: string) => {
    // Si le programme n'a pas d'entraînements associés, on empêche la suppression
    if (trainingsData.length === 0) {
      alert("Ce programme n'a pas d'entraînements associés et ne peut pas être supprimé.");
      return;
    }

    // Si le programme a des entraînements associés, procéder à la suppression
    await handleDelete(programId);
  };

const handleDuplicateClick = async () => {
  try {
    if (!userId) {
      alert("Impossible de dupliquer : utilisateur non connecté.");
      return;
    }

    // 1️⃣ Créer un nouveau programme
    const { data: newProgram, error: programError } = await supabase
      .from(programsTableName)
      .insert([
        {
          name: name + " (copie)",
        }
      ])
      .select()
      .single();

    if (programError) throw programError;

    console.log("✅ Nouveau programme créé", newProgram);

    // 2️⃣ Copier les trainings associés
    if (trainingsData.length > 0 && newProgram?.id) {
      const duplicatedTrainings = trainingsData.map(t => {
        const { id, program_id, ...rest } = t;
        return {
          ...rest,
          program_id: newProgram.id,
          user_id: userId,
        };
      });

      const { error: trainingsError } = await supabase
        .from(tableName)
        .insert(duplicatedTrainings);

      if (trainingsError) throw trainingsError;

      console.log("✅ Trainings copiés", duplicatedTrainings);
    }

    // 3️⃣ Notifier / rafraîchir
    setRefreshTrigger(prev => prev + 1);
    notifyTrainingChange('all-programs');
    notifyTrainingChange(newProgram.id);

  } catch (error) {
    console.error("❌ Erreur lors de la duplication du programme :", error);
    alert("Erreur lors de la duplication : " + (error as Error).message);
  }
};

  return (
    <div
    className="relative flex items-center justify-between bg-[#FBFCFE] h-[50px] mb-2"
    style={{ zIndex }}
    >
      {/* Conteneur du nom du programme centré avec z-index pour passer au-dessus de la ligne */}
      <div className="flex-1 flex justify-center items-center relative z-10">
        {editingIndex === index ? (
          <div className="relative max-w-[250px]">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => onChangeName(index, e.target.value)}
              onBlur={() => onSubmit(index)}
              onKeyDown={handleKeyDown}
              placeholder="Nom du programme"
              className="h-[34px] max-w-[250px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-[40px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            />
            {name && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChangeName(index, "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              aria-label="Effacer le nom"
            >
              <Tooltip content="Effacer">
                <div className="relative w-[25px] h-[25px] flex items-center justify-center">
                  <img
                    src="/icons/cross_reset.svg"
                    alt="Effacer"
                    className="absolute top-[3px] left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <img
                    src="/icons/cross_reset_hover.svg"
                    alt="Effacer"
                    className="absolute top-[3px] left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </Tooltip>
            </button>
            )}
          </div>
        ) : (
        <div
          className="group flex items-center text-[16px] text-[#D7D4DC] font-semibold transition cursor-pointer bg-[#FBFCFE] p-2 hover:text-[#C2BFC6]"
          onClick={() => onStartEdit(index)}
        >
          <span>{name || `Nom du programme`}</span>
          <Tooltip content="Editer">
          <div className="relative ml-1 w-[15px] h-[15px]">
            <img
              src="/icons/edit_program.svg"
              alt="Modifier"
              className="absolute top-0 left-0 w-full h-full opacity-100 group-hover:opacity-0"
            />
            <img
              src="/icons/edit_program_hover.svg"
              alt="Modifier"
              className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100"
            />
          </div>
          </Tooltip>
        </div>
        )}
      </div>

      {/* Icônes alignées à gauche avec z-index pour passer au-dessus de la ligne */}
      {!adminMode && (
      <div className="flex items-center absolute left-0 z-10 bg-[#FBFCFE] p-2">
        {trainingsData.length > 0 ? (
          <>
            <Tooltip content="Descendre">
              <button
                type="button"
                className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${isLastActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={onMoveDown}
                disabled={isLastActive}
                aria-label="Descendre"
              >
                <div className="relative w-full h-full">
                  <img
                    src="/icons/move_down.svg"
                    alt="Descendre"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <img
                    src="/icons/move_down_hover.svg"
                    alt="Descendre"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </button>
            </Tooltip>

            <Tooltip content="Monter">
              <button
                type="button"
                className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="Monter"
              >
                <div className="relative w-full h-full">
                  <img
                    src="/icons/move_up.svg"
                    alt="Monter"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <img
                    src="/icons/move_up_hover.svg"
                    alt="Monter"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </button>
            </Tooltip>

            <Tooltip content="Dupliquer">
              <button
                type="button"
                className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
                onClick={onDuplicate}
                aria-label="Dupliquer"
              >
                <div className="relative w-full h-full">
                  <img
                    src="/icons/duplicate.svg"
                    alt="Dupliquer"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <img
                    src="/icons/duplicate_hover.svg"
                    alt="Dupliquer"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </button>
            </Tooltip>

            {isNew && (
              <span className="ml-2 text-[10px] font-bold text-[#00D591] bg-[#DCFAF1] px-2 py-[2px] rounded-full h-[20px] flex items-center">
                NOUVEAU
              </span>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
              disabled
              aria-label="Descendre désactivée"
            >
              <div className="relative w-full h-full">
                <img
                  src="/icons/move_down.svg"
                  alt="Descendre désactivée"
                  className="absolute top-0 left-0 w-full h-full opacity-100"
                />
              </div>
            </button>

            <button
              type="button"
              className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
              disabled
              aria-label="Monter désactivée"
            >
              <div className="relative w-full h-full">
                <img
                  src="/icons/move_up.svg"
                  alt="Monter désactivée"
                  className="absolute top-0 left-0 w-full h-full opacity-100"
                />
              </div>
            </button>

            <button
              type="button"
              className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
              disabled
              aria-label="Dupliquer désactivée"
            >
              <div className="relative w-full h-full">
                <img
                  src="/icons/duplicate.svg"
                  alt="Dupliquer désactivée"
                  className="absolute top-0 left-0 w-full h-full opacity-100"
                />
              </div>
            </button>
          </>
        )}
      </div>
      )}

      {/* Icônes alignées à droite avec z-index pour passer au-dessus de la ligne */}
      {!adminMode && (
      <div className="flex items-center gap-3 absolute right-0 z-10 bg-[#FBFCFE] p-2">
      {trainingsData.length > 0 ? (
        <Tooltip content={isEyeVisible ? "Masquer dans l'app" : "Afficher dans l'app"}>
          <button
            type="button"
            className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
            onClick={handleEyeClick}
            aria-label={isEyeVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
          >
            <div className="relative w-full h-full">
              <img
                src={isEyeVisible ? "/icons/eye.svg" : "/icons/eye_closed.svg"}
                alt={isEyeVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
              />
              <img
                src={isEyeVisible ? "/icons/eye_hover.svg" : "/icons/eye_closed_hover.svg"}
                alt={isEyeVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
              />
            </div>
          </button>
        </Tooltip>
      ) : (
        <button
          type="button"
          className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
          disabled
          aria-label={isEyeVisible ? "Masquer" : "Afficher"}
        >
          <div className="relative w-full h-full">
            <img
              src={isEyeVisible ? "/icons/eye.svg" : "/icons/eye_closed.svg"}
              alt={isEyeVisible ? "Masquer" : "Afficher"}
              className="absolute top-0 left-0 w-full h-full opacity-100"
            />
          </div>
        </button>
      )}
      {trainingsData.length > 0 ? (
        <Tooltip content="Supprimer">
          <button
            type="button"
            className="relative w-[20px] h-[20px] transition duration-300 ease-in-out"
            onClick={() => handleDeleteClick(programId)}
            aria-label="Supprimer"
          >
            <div className="relative w-full h-full">
              <img
                src="/icons/trash.svg"
                alt="Supprimer"
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
              />
              <img
                src="/icons/trash_hover.svg"
                alt="Supprimer"
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
              />
            </div>
          </button>
        </Tooltip>
      ) : (
        <button
          type="button"
          className="relative w-[20px] h-[20px] opacity-50 cursor-not-allowed"
          disabled
          aria-label="Supprimer désactivé"
        >
          <div className="relative w-full h-full">
            <img
              src="/icons/trash.svg"
              alt="Supprimer désactivé"
              className="absolute top-0 left-0 w-full h-full opacity-100"
            />
          </div>
        </button>
      )}
      </div>
      )}
      {/* Nouvelle div pour la ligne sous la barre, z-index 0 pour être en dessous */}
      <div className="absolute bottom-6 left-0 w-full h-[1px] bg-[#ECE9F1] z-0"></div>
    </div>
  );
}

export function notifyTrainingChange(programId: string) {
  const channel = new BroadcastChannel("glift-refresh");
  if (programId === 'all-programs') {
    channel.postMessage('refresh-all-programs');
  } else {
    channel.postMessage(`refresh-${programId}`);
  }
  channel.close();
}

