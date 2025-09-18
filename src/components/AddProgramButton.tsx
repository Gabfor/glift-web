"use client";

interface AddProgramButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function AddProgramButton({ onClick, disabled }: AddProgramButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-4 text-blue-500 hover:underline text-sm"
    >
      + Ajouter un programme
    </button>
  );
}
