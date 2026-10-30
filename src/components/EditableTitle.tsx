"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

type Props = {
  loading?: boolean;
  editing: boolean;
  setEditing: (val: boolean) => void;
  programName: string;
  setProgramName: (val: string) => void;
  handleBlur: () => void;
  setIsEditing?: (val: boolean) => void;
  onCancel?: () => void;
  className?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  autoSelect?: boolean;
  autoScrollOnEdit?: boolean;
  adminMode?: boolean;
};

const DEFAULT_TRAINING_NAME = "Nom de l'entraînement";
const LEGACY_DEFAULT_TRAINING_NAME = "Nom de l’entraînement";

function EditableTitle({
  loading = false,
  editing,
  setEditing,
  programName,
  setProgramName,
  handleBlur,
  setIsEditing,
  onCancel,
  className,
  wrapperClassName,
  inputClassName,
  autoSelect = false,
  autoScrollOnEdit = true,
  adminMode = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerDownHandledRef = useRef(false);

  useEffect(() => {
    if (!loading && editing && inputRef.current) {
      inputRef.current.focus();
      if (autoSelect) {
        inputRef.current.select();
      } else {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
          }
        });
      }

      if (autoScrollOnEdit && typeof window !== "undefined") {
        const isResponsive =
          window.innerWidth < 768 ||
          (window.innerWidth < 1024 &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0)) ||
          (Boolean(window.visualViewport) &&
            (window.visualViewport?.height ?? window.innerHeight) < window.innerHeight);

        if (isResponsive) {
          let paddingAdded = 0;

          const ensureVisibleAboveKeyboard = () => {
            const input = inputRef.current;
            if (!input) return;

            const rect = input.getBoundingClientRect();
            const isLandscapeMobile =
              window.innerWidth > window.innerHeight && window.innerHeight < 550;
            const headerHeight = isLandscapeMobile ? 25 : 80;
            const safeTop = headerHeight + 10;

            const vv = window.visualViewport;
            const keyboardAllowance = isLandscapeMobile ? 180 : 340;
            const safeBottom =
              vv && vv.height < window.innerHeight - 50
                ? vv.height - 20
                : window.innerHeight - keyboardAllowance - 20;

            let scrollDelta = 0;

            // Trop bas : risque d'être masqué par le clavier
            if (rect.bottom > safeBottom) {
              scrollDelta = rect.bottom - safeBottom + 25;
            }
            // Trop haut : masqué sous le header fixe
            else if (rect.top < safeTop) {
              scrollDelta = rect.top - safeTop - 15;
            }

            // Si le champ est déjà dans la zone visible et sécurisée, on ne touche à rien (aucun yoyo !)
            if (Math.abs(scrollDelta) < 15) {
              return;
            }

            // Si on doit descendre dans la page (scrollDelta > 0), vérifier qu'il y a assez d'espace
            if (scrollDelta > 0) {
              const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight;
              const remainingScroll = Math.max(0, maxScroll - window.scrollY);

              if (remainingScroll < scrollDelta) {
                const needed = Math.ceil(scrollDelta - remainingScroll + 120);
                paddingAdded = Math.max(paddingAdded, needed);
                document.body.style.paddingBottom = `${paddingAdded}px`;
              }
            }

            window.scrollBy({
              top: scrollDelta,
              behavior: "smooth",
            });
          };

          // Vérification immédiate au focus, puis une confirmation une fois le clavier déployé (~380ms)
          const timerImmediate = setTimeout(ensureVisibleAboveKeyboard, 80);
          const timerKeyboard = setTimeout(ensureVisibleAboveKeyboard, 380);

          return () => {
            clearTimeout(timerImmediate);
            clearTimeout(timerKeyboard);
            if (paddingAdded > 0) {
              document.body.style.paddingBottom = "";
            }
          };
        }
      }
    }
  }, [loading, editing, autoSelect, autoScrollOnEdit]);

  const handleEnterEditMode = useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  const handleClear = useCallback(() => {
    setProgramName(""); // vide le champ
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus(); // focus reste actif
    });
  }, [setProgramName]);

  const handlePointerDownClear = (event: PointerEvent<HTMLButtonElement>) => {
    pointerDownHandledRef.current = true;
    event.preventDefault();
    event.stopPropagation();
    handleClear();
  };

  const resetPointerHandled = () => {
    pointerDownHandledRef.current = false;
  };

  const handleMouseDownClear = (event: MouseEvent<HTMLButtonElement>) => {
    if (!pointerDownHandledRef.current) {
      handleClear();
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
    handleClear();
  };

  const getDisplayName = (name: string) => {
    if (!name || name === LEGACY_DEFAULT_TRAINING_NAME) return DEFAULT_TRAINING_NAME;
    return name;
  };

  return (
    <div className={cn("text-center mb-[40px] max-w-full p-[2px]", className)}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-[40px] w-1/3 mx-auto bg-gray-300 rounded-md" />
        </div>
      ) : editing ? (
        <div
          className={cn("relative w-full max-w-[280px] mx-auto", wrapperClassName)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            ref={inputRef}
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            onFocus={() => setIsEditing?.(true)}
            onBlur={() => {
              setIsEditing?.(false);
              handleBlur();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                inputRef.current?.blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                if (onCancel) {
                  onCancel();
                } else {
                  setEditing(false);
                }
              }
            }}
            className={cn(
              "text-[16px] sm:text-[18px] text-[#3A416F] placeholder-[#D7D4DC] font-semibold border border-[#D7D4DC] rounded-[5px] px-4 py-2 pr-10 text-left w-full focus:outline-none focus:border-transparent focus:ring-2 transition bg-white",
              adminMode ? "focus:ring-[#5D6499]" : "focus:ring-[#A1A5FD]",
              inputClassName
            )}
            placeholder="Nom de l'entraînement"
          />
          {programName && (
            <button
              type="button"
              onPointerDown={handlePointerDownClear}
              onPointerUp={resetPointerHandled}
              onPointerCancel={resetPointerHandled}
              onMouseDown={handleMouseDownClear}
              onClick={handleKeyboardClear}
              className="absolute right-2 top-0 bottom-0 flex items-center p-1"
              aria-label="Effacer le nom"
            >
              <Tooltip content="Effacer">
                <div className="relative w-[25px] h-[25px] flex items-center justify-center">
                  <Image
                    src="/icons/cross_reset.svg"
                    alt="Effacer"
                    fill
                    sizes="100%"
                    className="absolute left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                  />
                  <Image
                    src="/icons/cross_reset_hover.svg"
                    alt="Effacer"
                    fill
                    sizes="100%"
                    className="absolute left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                  />
                </div>
              </Tooltip>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleEnterEditMode}
          className="group flex justify-center items-center gap-2 cursor-pointer w-fit max-w-full mx-auto hover:text-[#2E3271] transition px-1"
        >
          <p
            title={programName || DEFAULT_TRAINING_NAME}
            className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] group-hover:text-[#2E3271] truncate min-w-0"
          >
            {getDisplayName(programName)}
          </p>

          <Tooltip content="Editer" asChild>
            <div className="relative w-5 h-5 shrink-0 cursor-pointer select-none" onClick={handleEnterEditMode}>
              <Image
                src="/icons/edit.svg"
                alt="modifier"
                fill
                sizes="100%"
                className="pointer-events-none absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 [@media(hover:hover)]:group-hover:opacity-0"
              />
              <Image
                src="/icons/edit_hover.svg"
                alt="modifier"
                fill
                sizes="100%"
                className="pointer-events-none absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default EditableTitle;
