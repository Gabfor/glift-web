"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import AccountAccordionSection from "../AccountAccordionSection"
import ToggleField from "../fields/ToggleField"
import DropdownField from "../fields/DropdownField"
import SubmitButton from "../fields/SubmitButton"
import InfoTooltipAdornment from "../fields/InfoTooltipAdornment"
import ToggleSwitch from "@/components/ui/ToggleSwitch"
import ModalMessage from "@/components/ui/ModalMessage"
import { useUser } from "@/context/UserContext"
import { createClient } from "@/lib/supabaseClient"
import type { Database } from "@/lib/supabase/types"
import {
  CURVE_OPTIONS,
  type CurveOptionValue,
} from "@/constants/curveOptions"

const WEIGHT_UNIT_OPTIONS = ["Métrique (kg)", "Impérial (lb)"] as const
type WeightUnit = (typeof WEIGHT_UNIT_OPTIONS)[number]

type PreferencesRow = Database["public"]["Tables"]["preferences"]["Row"]
type PreferencesInsert = Database["public"]["Tables"]["preferences"]["Insert"]

const WEIGHT_UNIT_TO_DB: Record<WeightUnit, PreferencesRow["weight_unit"]> = {
  "Métrique (kg)": "kg",
  "Impérial (lb)": "lb",
}

const WEIGHT_UNIT_FROM_DB: Record<PreferencesRow["weight_unit"], WeightUnit> = {
  kg: "Métrique (kg)",
  lb: "Impérial (lb)",
}

const CURVE_TO_DB: Record<CurveOptionValue, PreferencesRow["curve"]> = {
  "poids-maximum": "maximum_weight",
  "poids-moyen": "average_weight",
  "poids-total": "total_weight",
  "repetition-maximum": "maximum_rep",
  "repetition-moyenne": "average_rep",
  "repetitions-totales": "total_rep",
}

const CURVE_FROM_DB: Record<PreferencesRow["curve"], CurveOptionValue> = {
  maximum_weight: "poids-maximum",
  average_weight: "poids-moyen",
  total_weight: "poids-total",
  maximum_rep: "repetition-maximum",
  average_rep: "repetition-moyenne",
  total_rep: "repetitions-totales",
}

const COMMUNICATION_FIELDS = [
  {
    key: "newsletterGlift" as const,
    title: "Newsletter Glift",
    description:
      "Vous serez informé des dernières nouveautés de la plateforme Glift. Pas de spam, c’est promis.",
  },
  {
    key: "surveys" as const,
    title: "Enquêtes et sondages",
    description:
      "Vous recevrez des enquêtes et des sondages afin de participer à l’évolution de Glift.",
  },
  {
    key: "shop" as const,
    title: "Newsletter Glift Shop",
    description:
      "Vous serez informé lorsque de nouvelles offres correspondant à votre profil seront ajoutées.",
  },
  {
    key: "store" as const,
    title: "Newsletter Glift Store",
    description:
      "Vous serez informé lorsque de nouvelles ressources d’entrainement correspondant à votre profil seront ajoutées.",
  },
] as const

const CURVE_TOOLTIP_MESSAGE =
  "Ce réglage détermine le type de courbe affichée par défaut dans votre tableau de bord."

type CommunicationKey = (typeof COMMUNICATION_FIELDS)[number]["key"]

type PreferencesState = {
  weightUnit: WeightUnit
  defaultCurve: CurveOptionValue
  showEffort: boolean
  showMateriel: boolean
  showRepos: boolean
  communications: Record<CommunicationKey, boolean>
}

const createInitialState = (): PreferencesState => ({
  weightUnit: WEIGHT_UNIT_OPTIONS[0],
  defaultCurve: CURVE_OPTIONS[0].value,
  showEffort: true,
  showMateriel: true,
  showRepos: true,
  communications: COMMUNICATION_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = false
      return acc
    },
    {} as Record<CommunicationKey, boolean>,
  ),
})

const COMMUNICATION_FIELD_TO_DB: Record<CommunicationKey, keyof PreferencesRow> = {
  newsletterGlift: "newsletter",
  surveys: "survey",
  shop: "newsletter_shop",
  store: "newsletter_store",
}

const createStateFromPreferences = (
  row: PreferencesRow | null,
): PreferencesState => {
  const base = createInitialState()
  if (!row) {
    return base
  }

  const communications = COMMUNICATION_FIELDS.reduce(
    (acc, field) => {
      const column = COMMUNICATION_FIELD_TO_DB[field.key]
      acc[field.key] = Boolean(row[column])
      return acc
    },
    {} as Record<CommunicationKey, boolean>,
  )

  return {
    weightUnit: WEIGHT_UNIT_FROM_DB[row.weight_unit] ?? base.weightUnit,
    defaultCurve: CURVE_FROM_DB[row.curve] ?? base.defaultCurve,
    showEffort: row.show_effort ?? base.showEffort,
    showMateriel: row.show_materiel ?? base.showMateriel,
    showRepos: row.show_repos ?? base.showRepos,
    communications,
  }
}

type CommunicationField = (typeof COMMUNICATION_FIELDS)[number]

type PreferenceToggleRowProps = {
  field: { title: string; description: string }
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function PreferenceToggleRow({ field, checked, onCheckedChange }: PreferenceToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <div className="flex-1 pr-2">
        <div className="text-[16px] font-bold text-[#3A416F] leading-tight">{field.title}</div>
        <p className="text-[15px] font-semibold text-[#5D6494] leading-snug mt-[4px]">
          {field.description}
        </p>
      </div>
      <div className="flex-shrink-0 translate-y-[-2px]">
        <ToggleSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          ariaLabel={`Activer ou désactiver ${field.title}`}
        />
      </div>
    </div>
  )
}

export default function PreferencesSection() {
  const initialStateRef = useRef<PreferencesState>(createInitialState())

  const { user } = useUser()
  const supabase = useMemo(() => createClient(), [])

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialStateRef.current.weightUnit)
  const [weightTouched, setWeightTouched] = useState(false)
  const [sessionCount, setSessionCount] = useState<string>("15")
  const [defaultCurve, setDefaultCurve] = useState<CurveOptionValue>(
    initialStateRef.current.defaultCurve,
  )
  const [curveTouched, setCurveTouched] = useState(false)
  const [showEffort, setShowEffort] = useState(initialStateRef.current.showEffort)
  const [showMateriel, setShowMateriel] = useState(initialStateRef.current.showMateriel)
  const [showRepos, setShowRepos] = useState(initialStateRef.current.showRepos)
  const [communications, setCommunications] = useState<Record<CommunicationKey, boolean>>(
    () => ({ ...initialStateRef.current.communications }),
  )
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const successMessageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showSuccessMessage && successMessageRef.current) {
      successMessageRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [showSuccessMessage])

  useEffect(() => {
    let isActive = true

    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoadingPreferences(false)
        return
      }

      setIsLoadingPreferences(true)

      const { data, error } = await supabase
        .from("preferences")
        .select(
          "id, weight_unit, curve, show_effort, show_materiel, show_repos, show_link, show_notes, newsletter, newsletter_shop, newsletter_store, survey",
        )
        .eq("id", user.id)
        .maybeSingle()

      if (!isActive) {
        return
      }

      if (error && error.code !== "PGRST116") {
        // console.error("Erreur lors du chargement des préférences", error)
      }

      const nextState = createStateFromPreferences(data ?? null)
      initialStateRef.current = {
        weightUnit: nextState.weightUnit,
        defaultCurve: nextState.defaultCurve,
        showEffort: nextState.showEffort,
        showMateriel: nextState.showMateriel,
        showRepos: nextState.showRepos,
        communications: { ...nextState.communications },
      }

      setWeightUnit(nextState.weightUnit)
      setDefaultCurve(nextState.defaultCurve)
      setShowEffort(nextState.showEffort)
      setShowMateriel(nextState.showMateriel)
      setShowRepos(nextState.showRepos)
      setCommunications({ ...nextState.communications })
      setWeightTouched(false)
      setCurveTouched(false)
      setIsLoadingPreferences(false)
      setShowSuccessMessage(false)
    }

    void loadPreferences()

    return () => {
      isActive = false
    }
  }, [supabase, user?.id])

  const hasChanges =
    weightUnit !== initialStateRef.current.weightUnit ||
    defaultCurve !== initialStateRef.current.defaultCurve ||
    showEffort !== initialStateRef.current.showEffort ||
    showMateriel !== initialStateRef.current.showMateriel ||
    showRepos !== initialStateRef.current.showRepos ||
    COMMUNICATION_FIELDS.some(
      (field) => communications[field.key] !== initialStateRef.current.communications[field.key],
    )

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (!user?.id) {
      return
    }

    const persistPreferences = async () => {
      setIsSubmitting(true)
      setShowSuccessMessage(false)
      const payload: PreferencesInsert = {
        id: user.id,
        weight_unit: WEIGHT_UNIT_TO_DB[weightUnit],
        curve: CURVE_TO_DB[defaultCurve],
        show_effort: showEffort,
        show_materiel: showMateriel,
        show_repos: showRepos,
        newsletter: communications.newsletterGlift,
        newsletter_shop: communications.shop,
        newsletter_store: communications.store,
        survey: communications.surveys,
      }

      const { error } = await supabase
        .from("preferences")
        .upsert(payload, { onConflict: "id" })

      if (error) {
        console.error("Erreur lors de la mise à jour des préférences", error)
        setIsSubmitting(false)
        return
      }

      initialStateRef.current = {
        weightUnit,
        defaultCurve,
        showEffort,
        showMateriel,
        showRepos,
        communications: { ...communications },
      }
      setWeightTouched(false)
      setCurveTouched(false)
      setIsSubmitting(false)
      setShowSuccessMessage(true)
    }

    void persistPreferences()
  }

  return (
    <AccountAccordionSection value="mes-preferences" title="Mes préférences">
      <form
        className="flex flex-col px-[100px] pb-0"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault()
        }}
      >
        {showSuccessMessage ? (
          <div ref={successMessageRef} className="mt-[14px] mb-[16px] flex w-full justify-center">
            <ModalMessage
              variant="success"
              title="Préférences mises à jour"
              description="Merci ! Vos préférences ont bien été enregistrées et sont applicables dès maintenant. Vous pouvez revenir les mettre à jour quand vous le souhaitez."
              className="w-full max-w-[564px]"
            />
          </div>
        ) : null}

        <div className="flex w-full text-left flex-col gap-5 pt-[14px]">
          <h3 className="text-[14px] font-semibold uppercase text-[#D7D4DC] tracking-wide">
            Réglages de la plateforme
          </h3>

          <div className="flex flex-col gap-2">
            <div className="w-full max-w-[368px]">
              <ToggleField
                label="Unités de poids"
                value={weightUnit}
                options={Array.from(WEIGHT_UNIT_OPTIONS)}
                onChange={(next) => {
                  if (!next) return
                  setWeightUnit(next as WeightUnit)
                  setWeightTouched(true)
                  setShowSuccessMessage(false)
                }}
                touched={weightTouched}
                setTouched={() => setWeightTouched(true)}
                containerClassName="w-full"
                className="w-[246px]"
              />
            </div>

            <div className="w-full max-w-[368px]">
              <div className="relative w-full">
                <DropdownField
                  label="Nombre de séances par défaut"
                  placeholder="Sélectionnez un nombre"
                  selected={sessionCount}
                  onSelect={(value) => {
                    setSessionCount(value)
                    setShowSuccessMessage(false)
                  }}
                  options={[
                    { value: "5", label: "5 dernières séances" },
                    { value: "10", label: "10 dernières séances" },
                    { value: "15", label: "15 dernières séances" },
                    { value: "20", label: "20 dernières séances" },
                  ]}
                  touched={false}
                  setTouched={() => { }}
                  clearable={false}
                  width="w-full"
                />
                <div
                  className="absolute top-1/2 left-[calc(100%+10px)] -translate-y-1/2 z-20"
                >
                  <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                    <InfoTooltipAdornment
                      message="Ce réglage détermine le nombre de séances affichées par défaut dans votre tableau de bord."
                      ariaLabel="Plus d’informations sur le nombre de séances par défaut"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[368px]">
              <div className="relative w-full">
                <DropdownField
                  label="Type de courbe par défaut"
                  placeholder="Sélectionnez un type de courbe"
                  selected={defaultCurve}
                  onSelect={(value) => {
                    setDefaultCurve(value as CurveOptionValue)
                    setCurveTouched(value !== "")
                    setShowSuccessMessage(false)
                  }}
                  options={CURVE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  touched={curveTouched}
                  setTouched={(isTouched) => setCurveTouched(isTouched)}
                  clearable={false}
                  width="w-full"
                />

                <div
                  className="absolute top-1/2 left-[calc(100%+10px)] -translate-y-1/2 z-20"
                >
                  <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                    <InfoTooltipAdornment
                      message={CURVE_TOOLTIP_MESSAGE}
                      ariaLabel="Plus d’informations sur le type de courbe par défaut"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[21px] mt-2">

              <PreferenceToggleRow
                field={{
                  title: "Afficher la colonne Effort",
                  description: "Afficher la colonne Effort dans les tableaux d'exercices. Ce réglage est valable également pour l’application mobile."
                }}
                checked={showEffort}
                onCheckedChange={(checked) => {
                  setShowEffort(checked)
                  setShowSuccessMessage(false)
                }}
              />

              <PreferenceToggleRow
                field={{
                  title: "Afficher la colonne Matériel",
                  description: "Afficher la colonne Matériel dans les tableaux d'exercices. Ce réglage est valable également pour l’application mobile."
                }}
                checked={showMateriel}
                onCheckedChange={(checked) => {
                  setShowMateriel(checked)
                  setShowSuccessMessage(false)
                }}
              />

              <PreferenceToggleRow
                field={{
                  title: "Afficher la colonne Repos",
                  description: "Afficher la colonne Repos dans les tableaux d'exercices. Ce réglage est valable également pour l’application mobile."
                }}
                checked={showRepos}
                onCheckedChange={(checked) => {
                  setShowRepos(checked)
                  setShowSuccessMessage(false)
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-[50px] flex w-full text-left flex-col gap-[21px]">
          <h3 className="text-[14px] font-semibold uppercase text-[#D7D4DC] tracking-wide">
            Réglages de vos communications
          </h3>

          <div className="flex flex-col gap-[21px]">
            {COMMUNICATION_FIELDS.map((field) => (
              <PreferenceToggleRow
                key={field.key}
                field={field}
                checked={communications[field.key]}
                onCheckedChange={(checked) => {
                  setCommunications((prev) => ({ ...prev, [field.key]: checked }))
                  setShowSuccessMessage(false)
                }}
              />
            ))}
          </div>
        </div>

        <SubmitButton
          label="Enregistrer mes préférences"
          loading={isSubmitting}
          disabled={!hasChanges || isLoadingPreferences || isSubmitting}
          containerClassName="mt-[35px] mb-[32px]"
        />
      </form>
    </AccountAccordionSection>
  )
}
