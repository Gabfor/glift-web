"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";
import { SettingsService } from "@/lib/services/settingsService";
import CTAButton from "@/components/CTAButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import GliftLoader from "@/components/ui/GliftLoader";
import {
  ALL_PALETTE_TOKENS,
  COLOR_SETTING_PREFIX,
  PALETTE_GROUPS,
  normalizeHex,
} from "@/constants/colorPalette";

type GradientStop = { color: string; opacity: string };

const GRADIENT_DEFAULTS: GradientStop[] = [
  { color: "#F6E9F9", opacity: "65" },
  { color: "#E4ECFF", opacity: "65" },
  { color: "#F0EBFF", opacity: "80" },
];

const withHash = (v: string) => (v.startsWith("#") ? v : `#${v}`);

function Chevron({ open }: { open: boolean }) {
  return (
    <div className="relative w-[18px] h-[18px]">
      <Image
        src="/icons/chevron_bloc.svg"
        alt="Chevron"
        fill
        className={`object-contain transition-transform duration-200 ${open ? "rotate-180" : ""} group-hover:hidden`}
      />
      <Image
        src="/icons/chevron_bloc_hover.svg"
        alt="Chevron Hover"
        fill
        className={`object-contain transition-transform duration-200 ${open ? "rotate-180" : ""} hidden group-hover:block`}
      />
    </div>
  );
}

function Swatch({
  label,
  defaultHex,
  value,
  onChange,
}: {
  label: string;
  defaultHex: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const isModified = value.toUpperCase() !== defaultHex.toUpperCase();

  const commitDraft = () => {
    if (draft !== null) {
      const hex = normalizeHex(draft);
      if (hex) onChange(hex);
      setDraft(null);
    }
  };

  return (
    <div className="flex flex-col w-[96px]" title={label}>
      <div className="rounded-[8px] border border-[#D7D4DC] shadow-glift overflow-hidden bg-white">
        <div className="relative h-[64px] cursor-pointer" style={{ backgroundColor: value }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={`Modifier ${label}`}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {isModified && (
            <span className="absolute top-[6px] right-[6px] w-[8px] h-[8px] rounded-full bg-white border border-[#3A416F]" />
          )}
        </div>
        <input
          type="text"
          value={draft ?? value}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === "Enter" && commitDraft()}
          maxLength={7}
          aria-label={`Code hex ${label}`}
          className="w-full h-[26px] text-center text-[11px] font-semibold text-[#3A416F] bg-white focus:outline-none focus:bg-[#F4F5FE] uppercase"
        />
      </div>
      <span className="mt-[6px] text-[11px] leading-tight text-[#5D6494] text-center line-clamp-2">{label}</span>
      {isModified && (
        <button
          type="button"
          onClick={() => onChange(defaultHex.toUpperCase())}
          className="mt-[2px] text-[11px] text-[#7069FA] hover:text-[#6660E4] underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}

export default function AdminColorsPage() {
  const supabase = createClient();
  const settingsService = useMemo(() => new SettingsService(supabase), []); // eslint-disable-line react-hooks/exhaustive-deps

  const defaults = useMemo(
    () => Object.fromEntries(ALL_PALETTE_TOKENS.map((t) => [t.id, t.defaultHex.toUpperCase()])),
    []
  );

  const [colors, setColors] = useState<Record<string, string>>(defaults);
  const [initialColors, setInitialColors] = useState<Record<string, string>>(defaults);

  const [gradientEnabled, setGradientEnabled] = useState(true);
  const [stops, setStops] = useState<GradientStop[]>(GRADIENT_DEFAULTS);
  const [initialGradient, setInitialGradient] = useState({ enabled: true, stops: GRADIENT_DEFAULTS });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries(PALETTE_GROUPS.map((g) => [g.id, false])),
    degrade: true,
  }));
  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    (async () => {
      try {
        const settings = await settingsService.getSettings();

        const loaded: Record<string, string> = { ...defaults };
        for (const t of ALL_PALETTE_TOKENS) {
          const raw = settings[`${COLOR_SETTING_PREFIX}${t.id}`];
          const hex = raw ? normalizeHex(raw) : null;
          if (hex) loaded[t.id] = hex;
        }
        setColors(loaded);
        setInitialColors(loaded);

        const enabled = settings["gradient_enabled"] !== "false";
        const loadedStops = GRADIENT_DEFAULTS.map((d, i) => ({
          color: settings[`gradient_color${i + 1}`] || d.color,
          opacity: settings[`gradient_opacity${i + 1}`] || d.opacity,
        }));
        setGradientEnabled(enabled);
        setStops(loadedStops);
        setInitialGradient({ enabled, stops: loadedStops });
      } catch (e) {
        console.error("Failed to load colors", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [settingsService, defaults]);

  const changedTokenIds = ALL_PALETTE_TOKENS.filter((t) => colors[t.id] !== initialColors[t.id]).map((t) => t.id);
  const gradientChanged =
    gradientEnabled !== initialGradient.enabled ||
    stops.some(
      (s, i) => s.color !== initialGradient.stops[i].color || s.opacity !== initialGradient.stops[i].opacity
    );
  const hasChanges = changedTokenIds.length > 0 || gradientChanged;

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      for (const id of changedTokenIds) {
        await settingsService.updateSetting(`${COLOR_SETTING_PREFIX}${id}`, colors[id]);
      }
      if (gradientChanged) {
        await settingsService.updateSetting("gradient_enabled", gradientEnabled ? "true" : "false");
        for (let i = 0; i < stops.length; i++) {
          await settingsService.updateSetting(`gradient_color${i + 1}`, stops[i].color);
          await settingsService.updateSetting(`gradient_opacity${i + 1}`, stops[i].opacity);
        }
      }
      setInitialColors(colors);
      setInitialGradient({ enabled: gradientEnabled, stops });
      setFeedback({ type: "success", message: "Couleurs sauvegardées. Rechargez le site pour voir le résultat." });
    } catch (e) {
      console.error("Save failed", e);
      setFeedback({ type: "error", message: "Erreur lors de la sauvegarde." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStop = (i: number, patch: Partial<GradientStop>) =>
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  if (isLoading) return <GliftLoader isAdmin />;

  return (
    <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-3xl relative z-10">
        <h2 className="text-[24px] sm:text-[30px] font-bold text-[#3A416F] text-center mb-[40px]">
          Palette de couleurs
        </h2>

        <div className="flex flex-col gap-8 w-full">
          {PALETTE_GROUPS.map((group) => (
            <div key={group.id} className="flex flex-col">
              <div
                onClick={() => toggle(group.id)}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">{group.label}</h3>
                <Chevron open={!collapsed[group.id]} />
              </div>
              {!collapsed[group.id] && (
                <div className="flex flex-wrap gap-x-4 gap-y-5 mt-[10px]">
                  {group.tokens.map((t) => (
                    <Swatch
                      key={t.id}
                      label={t.label}
                      defaultHex={t.defaultHex}
                      value={colors[t.id]}
                      onChange={(hex) => setColors((prev) => ({ ...prev, [t.id]: hex }))}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* DÉGRADÉ (déplacé depuis Paramètres) */}
          <div className="flex flex-col">
            <div
              onClick={() => toggle("degrade")}
              className="flex justify-between items-center cursor-pointer group mb-[10px]"
            >
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">Dégradé</h3>
              <div className="flex items-center gap-4">
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch checked={gradientEnabled} onCheckedChange={setGradientEnabled} />
                </div>
                <Chevron open={!collapsed.degrade} />
              </div>
            </div>

            {!collapsed.degrade && (
              <div className="flex flex-col gap-5 mt-[10px]">
                {stops.map((stop, i) => {
                  const hex = withHash(stop.color);
                  return (
                    <div key={i}>
                      <span className="text-[16px] text-[#3A416F] font-bold mb-[8px] block">Couleur {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <div className="relative w-[45px] h-[45px] rounded-[8px] border border-[#D7D4DC] overflow-hidden flex-shrink-0 cursor-pointer">
                          <div className="w-full h-full" style={{ backgroundColor: hex }} />
                          <input
                            type="color"
                            value={hex}
                            onChange={(e) => updateStop(i, { color: e.target.value.toUpperCase() })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        <input
                          type="text"
                          value={stop.color}
                          onChange={(e) => updateStop(i, { color: e.target.value })}
                          placeholder="#FBFCFE"
                          className="w-full max-w-[280px] h-[45px] px-4 rounded-[8px] border border-[#D7D4DC] text-[#3A416F] font-semibold text-[15px] focus:outline-none focus:border-[#3A416F] uppercase"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={stop.opacity}
                          onChange={(e) => updateStop(i, { opacity: e.target.value })}
                          aria-label={`Opacité couleur ${i + 1}`}
                          className="w-[65px] h-[45px] px-2 rounded-[8px] border border-[#D7D4DC] text-[#3A416F] font-semibold text-[15px] text-center focus:outline-none focus:border-[#3A416F]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-[50px] flex flex-col items-center gap-3">
          <CTAButton
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasChanges}
            variant={hasChanges ? "active" : "inactive"}
          >
            Sauvegarder
          </CTAButton>
          {feedback && (
            <span
              className={`text-sm font-semibold ${feedback.type === "success" ? "text-[#00A370]" : "text-[#EF4F4E]"}`}
            >
              {feedback.message}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
