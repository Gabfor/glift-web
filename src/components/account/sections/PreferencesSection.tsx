"use client"

import { useMemo, useRef, useState } from "react"
import AccountAccordionSection from "../AccountAccordionSection"
import ToggleField from "../fields/ToggleField"
import DropdownField from "../fields/DropdownField"
import SubmitButton from "../fields/SubmitButton"
import InfoTooltipAdornment from "../fields/InfoTooltipAdornment"
import ToggleSwitch from "@/components/ui/ToggleSwitch"

const WEIGHT_UNIT_OPTIONS = ["Métrique (kg)", "Impérial (lb)"] as const

const CURVE_OPTIONS = [
  { value: "poids-moyen", label: "Poids moyen" },
  { value: "poids-median", label: "Poids médian" },
  { value: "poids-maximal", label: "Poids maximal" },
] as const

const COMMUNICATION_FIELDS = [
  {
    key: "newsletterGlift" as const,
    title: "Newsletter Glift",
    description: "Vous serez informé des dernières nouveautés de la plateforme Glift. Pas de spam, c’est promis.",
  },
  {
    key: "surveys" as const,
    title: "Enquêtes et sondages",
    description: "Vous recevrez des enquêtes et des sondages afin de participer à l’évolution de Glift.",
  },
  {
    key: "shop" as const,
    title: "Newsletter Glift Shop",
    description: "Vous serez informé lorsque de nouvelles offres correspondant à votre profil seront ajoutées.",
  },
  {
    key: "store" as const,
    title: "Newsletter Glift Store",
    description: "Vous serez informé lorsque de nouvelles ressources d’entrainement correspondant à votre profil seront ajoutées.",
  },
] as const

const CURVE_TOOLTIP_MESSAGE =
  "Ce réglage détermine la courbe affichée par défaut dans vos graphiques et vos tableaux de bord."

type WeightUnit = (typeof WEIGHT_UNIT_OPTIONS)[number]
type CurveOptionValue = (typeof CURVE_OPTIONS)[number]["value"]
type CommunicationKey = (typeof COMMUNICATION_FIELDS)[number]["key"]

type PreferencesState = {
  weightUnit: WeightUnit
  defaultCurve: CurveOptionValue
  communications: Record<CommunicationKey, boolean>
}

const createInitialState = (): PreferencesState => ({
  weightUnit: WEIGHT_UNIT_OPTIONS[0],
  defaultCurve: CURVE_OPTIONS[0].value,
  communications: COMMUNICATION_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = false
      return acc
    },
    {} as Record<CommunicationKey, boolean>,
  ),
})

type CommunicationField = (typeof COMMUNICATION_FIELDS)[number]

type PreferenceToggleRowProps = {
  field: CommunicationField
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function PreferenceToggleRow({ field, checked, onCheckedChange }: PreferenceToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 pr-2">
        <div className="text-[16px] font-bold text-[#3A416F] leading-snug">{field.title}</div>
        <p className="text-[16px] font-semibold text-[#5D6494] leading-snug mt-1">{field.description}</p>
      </div>
      <ToggleSwitch
        checked={checked}
        onCheckedChange={onCheckedChange}
        ariaLabel={`Activer ou désactiver ${field.title}`}
      />
    </div>
  )
}

export default function PreferencesSection() {
  const initialStateRef = useRef<PreferencesState>(createInitialState())

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialStateRef.current.weightUnit)
  const [weightTouched, setWeightTouched] = useState(false)
  const [defaultCurve, setDefaultCurve] = useState<CurveOptionValue>(initialStateRef.current.defaultCurve)
  const [curveTouched, setCurveTouched] = useState(false)
  const [communications, setCommunications] = useState<Record<CommunicationKey, boolean>>(
    () => ({ ...initialStateRef.current.communications }),
  )

  const hasChanges = useMemo(() => {
    if (weightUnit !== initialStateRef.current.weightUnit) return true
    if (defaultCurve !== initialStateRef.current.defaultCurve) return true

    return COMMUNICATION_FIELDS.some(
      (field) => communications[field.key] !== initialStateRef.current.communications[field.key],
    )
  }, [communications, defaultCurve, weightUnit])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    initialStateRef.current = {
      weightUnit,
      defaultCurve,
      communications: { ...communications },
    }

    setWeightTouched(false)
    setCurveTouched(false)
  }

  return (
    <AccountAccordionSection value="mes-preferences" title="Mes préférences">
      <form
        className="flex flex-col px-[100px]"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
          }
        }}
      >
        <div className="flex w-full max-w-[368px] flex-col gap-4 pt-[30px]">
          <h3 className="text-[14px] font-bold uppercase text-[#D7D4DC]">
            Réglages de la plateforme
          </h3>

          <ToggleField
            label="Unités de poids"
            value={weightUnit}
            options={Array.from(WEIGHT_UNIT_OPTIONS)}
            onChange={(next) => {
              if (!next) {
                return
              }
              setWeightUnit(next as WeightUnit)
              setWeightTouched(true)
            }}
            touched={weightTouched}
            setTouched={() => setWeightTouched(true)}
            className="w-[246px]"
          />

          <DropdownField
            label="Type de courbe par défaut"
            placeholder="Sélectionnez un type de courbe"
            selected={defaultCurve}
            onSelect={(value) => {
              setDefaultCurve(value as CurveOptionValue)
              setCurveTouched(value !== "")
            }}
            options={CURVE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            touched={curveTouched}
            setTouched={(isTouched) => setCurveTouched(isTouched)}
            endAdornment={
              <InfoTooltipAdornment
                message={CURVE_TOOLTIP_MESSAGE}
                ariaLabel="Plus d’informations sur le type de courbe par défaut"
              />
            }
            clearable={false}
          />
        </div>

        <div className="mt-[30px] flex w-full max-w-[368px] flex-col gap-[30px]">
          <h3 className="text-[14px] font-bold uppercase text-[#D7D4DC]">
            Réglages de vos communications
          </h3>

          <div className="flex flex-col gap-[30px]">
            {COMMUNICATION_FIELDS.map((field) => (
              <PreferenceToggleRow
                key={field.key}
                field={field}
                checked={communications[field.key]}
                onCheckedChange={(checked) => {
                  setCommunications((prev) => ({ ...prev, [field.key]: checked }))
                }}
              />
            ))}
          </div>
        </div>

        <SubmitButton
          label="Mettre à jour"
          loading={false}
          disabled={!hasChanges}
          className="mt-6 self-start"
        />
      </form>
    </AccountAccordionSection>
  )
}
