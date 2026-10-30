"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Tooltip from "@/components/Tooltip";
import { TrashHoverIcon, TrashIcon } from "./icons/TrashIcons";

const DEFAULT_PROGRAM_NAME = "Nom du programme";

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
  dashboardVisible: boolean;
  onDashboardVisibilityChange?: (visible: boolean) => void;
  isFirst: boolean;
  isLastActive: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  zIndex?: number;
  tableName: "trainings" | "trainings_admin";
  programsTableName: string;
  adminMode?: boolean;
  isNew?: boolean;
  shouldWarnOnHide?: boolean;
}

type ProgramTrainingSummary = {
  id: string;
  name: string | null;
  program_id: string;
  position: number | null;
  app: boolean | null;
};

import ProgramHideWarningModal from "./ProgramHideWarningModal";
import ProgramMenu from "./ProgramMenu";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

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
  dashboardVisible,
  onDashboardVisibilityChange,
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
  shouldWarnOnHide = false,
}: ProgramEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabaseClient();
  const pointerDownHandledRef = useRef(false);

  const [isAppVisible, setIsAppVisible] = useState(isVisible);
  const [isDashboardVisible, setIsDashboardVisible] = useState(
    dashboardVisible,
  );
  const [isUpdatingDashboardVisibility, setIsUpdatingDashboardVisibility] = useState(false);
  const [trainingsData, setTrainingsData] = useState<ProgramTrainingSummary[]>([]);
  const [localName, setLocalName] = useState(name ?? "");
  const [showHideWarningModal, setShowHideWarningModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);

  const handleClearName = useCallback(() => {
    setLocalName("");
    onChangeName(index, "");
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
    });
  }, [index, onChangeName]);

  const handlePointerDownClear = (event: PointerEvent<HTMLButtonElement>) => {
    pointerDownHandledRef.current = true;
    event.preventDefault();
    event.stopPropagation();
    handleClearName();
  };

  const resetPointerHandled = () => {
    pointerDownHandledRef.current = false;
  };

  const handleMouseDownClear = (event: MouseEvent<HTMLButtonElement>) => {
    if (!pointerDownHandledRef.current) {
      handleClearName();
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyboardClear = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    handleClearName();
  };

  const fetchTrainingsData = useCallback(async () => {
    if (!programId || programId === "xxx") {
      setTrainingsData([]);
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("id, name, program_id, position, app")
      .eq("program_id", programId);

    if (error) {
      console.error("Erreur lors de la récupération des entraînements :", error);
      return;
    }

    const sanitized = ((data as ProgramTrainingSummary[] | null) ?? []).map(
      (row) => ({
        id: String(row.id),
        name: row.name ?? null,
        program_id: row.program_id ?? programId,
        position: row.position ?? null,
        app: row.app ?? null,
      })
    );

    setTrainingsData(sanitized);
  }, [programId, supabase, tableName]);

  useEffect(() => {
    void fetchTrainingsData();
  }, [fetchTrainingsData]);

  useEffect(() => {
    setIsAppVisible(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (editingIndex === index && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex, index]);

  useEffect(() => {
    if (editingIndex !== index) {
      setLocalName(name ?? "");
    }
  }, [editingIndex, index, name]);

  useEffect(() => {
    setIsDashboardVisible(dashboardVisible);
  }, [dashboardVisible]);

  useEffect(() => {
    const channel = new BroadcastChannel("glift-refresh");
    channel.onmessage = (event) => {
      if (event.data === `refresh-${programId}` || event.data === "refresh-all-programs") {
        void fetchTrainingsData();
      }
    };
    return () => channel.close();
  }, [fetchTrainingsData, programId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(index);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleStartEditClick = useCallback(() => {
    const trimmedName = (name ?? "").trim();
    if (!trimmedName || trimmedName === DEFAULT_PROGRAM_NAME) {
      setLocalName("");
    } else {
      setLocalName(trimmedName);
    }
    onStartEdit(index);
  }, [index, name, onStartEdit, setLocalName]);

  const executeToggleVisibility = async () => {
    const newVisibility = !isAppVisible;
    setIsAppVisible(newVisibility);

    try {
      // 1. Update Program visibility
      const { error } = await supabase
        .from(programsTableName)
        .update({ app: newVisibility })
        .eq("id", programId);

      if (error) throw error;

      // 2. Cascade: Update visibility for ALL trainings in this program
      const { error: trainingsError } = await supabase
        .from(tableName)
        .update({ app: newVisibility })
        .eq("program_id", programId);

      if (trainingsError) {
        console.error("Error syncing trainings visibility:", trainingsError);
        throw trainingsError;
      }

      onToggleVisibility();
      notifyTrainingChange(programId);
      notifyTrainingChange("all-programs");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité app :", error);
      setIsAppVisible(!newVisibility);
    }
  };

  // Fonction pour basculer l'icône de l'app
  const handleAppClick = async () => {
    if (!programId || programId === "xxx") return;

    if (isAppVisible && shouldWarnOnHide) {
      setShowHideWarningModal(true);
      return;
    }

    await executeToggleVisibility();
  };

  const handleDashboardClick = async () => {
    if (
      trainingsData.length === 0 ||
      isUpdatingDashboardVisibility ||
      !programId ||
      programId === "xxx"
    ) {
      return;
    }

    const newVisibility = !isDashboardVisible;

    setIsUpdatingDashboardVisibility(true);
    setIsDashboardVisible(newVisibility);

    try {
      const { error } = await supabase
        .from(programsTableName)
        .update({ dashboard: newVisibility })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      onDashboardVisibilityChange?.(newVisibility);
      notifyTrainingChange(programId);
      notifyTrainingChange("all-programs");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la visibilité dans le tableau de bord :",
        error
      );
      setIsDashboardVisible(!newVisibility);
    } finally {
      setIsUpdatingDashboardVisibility(false);
    }
  };



  return (
    <>
      <div
      className={`relative flex items-center justify-between h-[50px] mb-2 ${adminMode ? "bg-transparent" : "bg-[#FBFCFE]"} ${isMobileMenuOpen ? "z-50" : ""}`}
      style={{ zIndex: isMobileMenuOpen ? 50 : zIndex }}
    >
      {/* Conteneur du nom du programme centré avec z-index pour passer au-dessus de la ligne */}
      <div className="flex-1 flex justify-center items-center relative z-10 px-10 md:px-0">
        {editingIndex === index ? (
          <div className="relative max-w-[250px] w-full">
            <input
              ref={inputRef}
              value={localName}
              onChange={(e) => {
                const value = e.target.value;
                setLocalName(value);
                onChangeName(index, value);
              }}
              onBlur={() => onSubmit(index)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (localName.trim() === DEFAULT_PROGRAM_NAME) {
                  requestAnimationFrame(() => inputRef.current?.select());
                }
              }}
              placeholder={DEFAULT_PROGRAM_NAME}
              style={adminMode ? ({ "--color-focus-ring": "#3A416F" } as React.CSSProperties) : undefined}
              className={`h-[34px] max-w-[250px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-[40px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] focus:outline-none focus:border-transparent focus:ring-2 ${
                adminMode ? "focus:ring-[#3A416F]" : "focus:ring-[#A1A5FD]"
              }`}
            />
            {localName.length > 0 && (
              <button
                type="button"
                onPointerDown={handlePointerDownClear}
                onPointerUp={resetPointerHandled}
                onPointerCancel={resetPointerHandled}
                onMouseDown={handleMouseDownClear}
                onClick={handleKeyboardClear}
                className="absolute right-2 top-[60%] -translate-y-1/2 p-1"
                aria-label="Effacer le nom"
              >
                <Tooltip content="Effacer">
                  <div className="relative w-[25px] h-[25px] flex items-center justify-center">
                    <Image
                      src="/icons/cross_reset.svg"
                      alt="Effacer"
                      fill
                      sizes="100%"
                      className="absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                    />
                    <Image
                      src="/icons/cross_reset_hover.svg"
                      alt="Effacer"
                      fill
                      sizes="100%"
                      className="absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                    />
                  </div>
                </Tooltip>
              </button>
            )}
          </div>
        ) : (
          <div
            className={`group flex items-center text-[16px] text-[#D7D4DC] font-semibold transition cursor-pointer p-2 hover:text-[#C2BFC6] ${adminMode ? "bg-transparent" : "bg-[#FBFCFE]"}`}
            onClick={handleStartEditClick}
          >
            <span className="truncate max-w-[200px] sm:max-w-none">{name || DEFAULT_PROGRAM_NAME}</span>
            <Tooltip content="Editer">
              <div
                className="relative ml-1 w-[15px] h-[15px] cursor-pointer select-none"
                onClick={handleStartEditClick}
              >
                <Image
                  src="/icons/edit_program.svg"
                  alt="Modifier"
                  fill
                  sizes="100%"
                  className="pointer-events-none absolute top-0 left-0 w-full h-full opacity-100 [@media(hover:hover)]:group-hover:opacity-0"
                />
                <Image
                  src="/icons/edit_program_hover.svg"
                  alt="Modifier"
                  fill
                  sizes="100%"
                  className="pointer-events-none absolute top-0 left-0 w-full h-full opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                />
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Icônes alignées à gauche (Desktop uniquement) */}
      {!adminMode && (
        <div className={`hidden md:flex items-center absolute left-0 z-10 p-2 ${adminMode ? "bg-transparent" : "bg-[#FBFCFE]"}`}>
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
                    <Image
                      src="/icons/move_down.svg"
                      alt="Descendre"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                    />
                    <Image
                      src="/icons/move_down_hover.svg"
                      alt="Descendre"
                      fill
                      sizes="100%"
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
                    <Image
                      src="/icons/move_up.svg"
                      alt="Monter"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                    />
                    <Image
                      src="/icons/move_up_hover.svg"
                      alt="Monter"
                      fill
                      sizes="100%"
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
                    <Image
                      src="/icons/duplicate.svg"
                      alt="Dupliquer"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                    />
                    <Image
                      src="/icons/duplicate_hover.svg"
                      alt="Dupliquer"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                    />
                  </div>
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content="Descendre">
                <button
                  type="button"
                  className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
                  disabled
                  aria-label="Descendre désactivée"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/icons/move_down.svg"
                      alt="Descendre désactivée"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full opacity-100"
                    />
                  </div>
                </button>
              </Tooltip>

              <Tooltip content="Monter">
                <button
                  type="button"
                  className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
                  disabled
                  aria-label="Monter désactivée"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/icons/move_up.svg"
                      alt="Monter désactivée"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full opacity-100"
                    />
                  </div>
                </button>
              </Tooltip>

              <Tooltip content="Dupliquer">
                <button
                  type="button"
                  className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
                  disabled
                  aria-label="Dupliquer désactivée"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/icons/duplicate.svg"
                      alt="Dupliquer désactivée"
                      fill
                      sizes="100%"
                      className="absolute top-0 left-0 w-full h-full opacity-100"
                    />
                  </div>
                </button>
              </Tooltip>
            </>
          )}
          {isNew && (
            <span className="ml-2.5 text-[10px] font-bold text-[#00D591] bg-[#DCFAF1] px-2 py-[2px] rounded-full h-[20px] flex items-center select-none">
              NOUVEAU
            </span>
          )}
        </div>
      )}

      {/* Badge nouveau sur mobile (cercle dans un cercle) */}
      {!adminMode && isNew && (
        <div className={`flex md:hidden items-center absolute left-0 z-10 p-2 ${adminMode ? "bg-transparent" : "bg-[#FBFCFE]"}`}>
          <Tooltip content="Nouveau programme">
            <div className="w-[20px] h-[20px] rounded-full bg-[#DCFAF1] flex items-center justify-center select-none">
              <div className="w-[10px] h-[10px] rounded-full bg-[#00D591]" />
            </div>
          </Tooltip>
        </div>
      )}

      {/* Icônes alignées à droite (Desktop uniquement) */}
      {!adminMode && (
        <div className={`hidden md:flex items-center gap-3 absolute right-0 z-10 p-2 ${adminMode ? "bg-transparent" : "bg-[#FBFCFE]"}`}>
          {trainingsData.length > 0 ? (
            <Tooltip content={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}>
              <button
                type="button"
                className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
                onClick={handleAppClick}
                aria-label={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={isAppVisible ? "/icons/app.svg" : "/icons/app_hidden.svg"}
                    alt={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <Image
                    src={isAppVisible ? "/icons/app_hover.svg" : "/icons/app_hidden_hover.svg"}
                    alt={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </button>
            </Tooltip>
          ) : (
            <Tooltip content={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}>
              <button
                type="button"
                className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
                disabled
                aria-label={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={isAppVisible ? "/icons/app.svg" : "/icons/app_hidden.svg"}
                    alt={isAppVisible ? "Masquer dans l'app" : "Afficher dans l'app"}
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full opacity-100"
                  />
                </div>
              </button>
            </Tooltip>
          )}
          {trainingsData.length > 0 ? (
            <Tooltip
              content={
                isDashboardVisible
                  ? "Masquer dans le tableau de bord"
                  : "Afficher dans le tableau de bord"
              }
            >
              <button
                type="button"
                className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${isUpdatingDashboardVisibility ? "cursor-not-allowed opacity-50" : ""
                  }`}
                onClick={handleDashboardClick}
                aria-label={
                  isDashboardVisible
                    ? "Masquer dans le tableau de bord"
                    : "Afficher dans le tableau de bord"
                }
                disabled={isUpdatingDashboardVisibility}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={
                      isDashboardVisible
                        ? "/icons/dashboard.svg"
                        : "/icons/dashboard_hidden.svg"
                    }
                    alt={
                      isDashboardVisible
                        ? "Masquer dans le tableau de bord"
                        : "Afficher dans le tableau de bord"
                    }
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <Image
                    src={
                      isDashboardVisible
                        ? "/icons/dashboard_hover.svg"
                        : "/icons/dashboard_hidden_hover.svg"
                    }
                    alt={
                      isDashboardVisible
                        ? "Masquer dans le tableau de bord"
                        : "Afficher dans le tableau de bord"
                    }
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </button>
            </Tooltip>
          ) : (
            <Tooltip
              content={
                isDashboardVisible
                  ? "Masquer dans le tableau de bord"
                  : "Afficher dans le tableau de bord"
              }
            >
              <button
                type="button"
                className="relative w-[25px] h-[25px] opacity-50 cursor-not-allowed"
                disabled
                aria-label={
                  isDashboardVisible
                    ? "Masquer dans le tableau de bord"
                    : "Afficher dans le tableau de bord"
                }
              >
                <div className="relative w-full h-full">
                  <Image
                    src={
                      isDashboardVisible
                        ? "/icons/dashboard.svg"
                        : "/icons/dashboard_hidden.svg"
                    }
                    alt={
                      isDashboardVisible
                        ? "Masquer dans le tableau de bord"
                        : "Afficher dans le tableau de bord"
                    }
                    fill
                    sizes="100%"
                    className="absolute top-0 left-0 w-full h-full opacity-100"
                  />
                </div>
              </button>
            </Tooltip>
          )}
          {trainingsData.length > 0 ? (
            <Tooltip content="Supprimer">
              <button
                type="button"
                className="relative w-[20px] h-[20px] transition duration-300 ease-in-out"
                onClick={onDelete}
                aria-label="Supprimer"
              >
                <div className="relative w-full h-full">
                  <TrashIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0" />
                  <TrashHoverIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100" />
                </div>
              </button>
            </Tooltip>
          ) : (
            <Tooltip content="Supprimer">
              <button
                type="button"
                className="relative w-[20px] h-[20px] opacity-50 cursor-not-allowed"
                disabled
                aria-label="Supprimer désactivé"
              >
                <div className="relative w-full h-full">
                  <TrashIcon className="absolute top-0 left-0 h-full w-full opacity-100" />
                </div>
              </button>
            </Tooltip>
          )}
        </div>
      )}

      {/* Menu responsive mobile (Mobile uniquement) */}
      {!adminMode && (
        <ProgramMenu
          isFirst={isFirst}
          isLastActive={isLastActive}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onToggleVisibility={() => setShowVisibility((prev) => !prev)}
          onDelete={onDelete}
          hasTrainings={trainingsData.length > 0}
          onOpenChange={setIsMobileMenuOpen}
        />
      )}
      {adminMode ? (
        <>
          {/* 2 lignes séparées (gauche et droite) pour ne pas croiser le texte au centre en admin */}
          <div className="absolute bottom-6 left-0 w-[calc(50%-140px)] h-[1px] bg-[#ECE9F1] z-0" />
          <div className="absolute bottom-6 right-0 w-[calc(50%-140px)] h-[1px] bg-[#ECE9F1] z-0" />
        </>
      ) : (
        <div className="absolute bottom-6 left-0 w-full h-[1px] bg-[#ECE9F1] z-0" />
      )}

      <ProgramHideWarningModal
        show={showHideWarningModal}
        onCancel={() => setShowHideWarningModal(false)}
        onConfirm={async () => {
          await executeToggleVisibility();
          setShowHideWarningModal(false);
        }}
      />
    </div>

    {/* Panneau de visibilité mobile du programme (identique à VisibilityPanel) */}
    {!adminMode && showVisibility && (
      <div className="md:hidden bg-white p-4 border border-[#D7D4DC] rounded-[8px] shadow-glift mb-4 relative z-10 w-full animate-in fade-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[16px] font-semibold text-[#3A416F]">Visibilité du programme</div>
          <button
            type="button"
            onClick={() => setShowVisibility(false)}
            className="relative w-[24px] h-[24px]"
          >
            <Image
              src="/icons/close.svg"
              alt="Fermer"
              fill
              sizes="100%"
              className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
            />
            <Image
              src="/icons/close_hover.svg"
              alt="Fermer (hover)"
              fill
              sizes="100%"
              className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
            />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-[16px] font-semibold text-[#5D6494]">Application mobile</span>
          <ToggleSwitch
            checked={isAppVisible}
            isAdmin={false}
            onCheckedChange={handleAppClick}
            disabled={trainingsData.length === 0}
            ariaLabel="Basculer la visibilité sur l’application mobile"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[16px] font-semibold text-[#5D6494]">Tableau de bord</span>
          <ToggleSwitch
            checked={isDashboardVisible}
            isAdmin={false}
            onCheckedChange={handleDashboardClick}
            disabled={trainingsData.length === 0 || isUpdatingDashboardVisibility}
            ariaLabel="Basculer la visibilité sur le tableau de bord"
          />
        </div>
      </div>
    )}
  </>
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

