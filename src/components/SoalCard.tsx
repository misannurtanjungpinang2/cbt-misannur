"use client";

import React from "react";

export interface SoalData {
  id: number | string;
  number: number;
  type: "pg" | "essay";
  text: string;

  // PG options
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
}

export interface SoalCardProps {
  soal: SoalData;
  selectedAnswer?: string;
  isFlagged?: boolean;
  onAnswerChange?: (soalId: number | string, answer: string) => void;
  onToggleFlag?: (soalId: number | string) => void;
  disabled?: boolean;
}

export default function SoalCard({
  soal,
  selectedAnswer = "",
  isFlagged = false,
  onAnswerChange,
  onToggleFlag,
  disabled = false,
}: SoalCardProps) {
  const handleRadioChange = (value: string) => {
    if (disabled) return;
    if (onAnswerChange) {
      onAnswerChange(soal.id, value);
    }
  };

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (onAnswerChange) {
      onAnswerChange(soal.id, e.target.value);
    }
  };

  const handleFlagToggle = () => {
    if (disabled) return;
    if (onToggleFlag) {
      onToggleFlag(soal.id);
    }
  };

  const typeLabel = soal.type === "pg" ? "PG" : "Isian";
  const options: { key: string; value: string }[] = [];
  if (soal.type === "pg") {
    if (soal.optionA) options.push({ key: "A", value: soal.optionA });
    if (soal.optionB) options.push({ key: "B", value: soal.optionB });
    if (soal.optionC) options.push({ key: "C", value: soal.optionC });
    if (soal.optionD) options.push({ key: "D", value: soal.optionD });
  }

  return (
    <div className="question-card">
      <div>
        <span className="question-badge">
          Soal {soal.number} ({typeLabel})
        </span>
        {isFlagged && <span className="flagged-badge">🚩 Ragu</span>}
      </div>

      <div
        className="question-text"
        dangerouslySetInnerHTML={{ __html: soal.text }}
      />

      {soal.type === "pg" && options.length > 0 && (
        <div className="options">
          {options.map((opt) => (
            <React.Fragment key={opt.key}>
              <input
                type="radio"
                id={`soal-${soal.id}-opt-${opt.key}`}
                name={`soal-${soal.id}-pg`}
                value={opt.key}
                checked={selectedAnswer === opt.key}
                onChange={() => handleRadioChange(opt.key)}
                disabled={disabled}
              />
              <label htmlFor={`soal-${soal.id}-opt-${opt.key}`}>
                {opt.key}. {opt.value}
              </label>
            </React.Fragment>
          ))}
        </div>
      )}

      {soal.type === "essay" && (
        <div className="essay-area">
          <textarea
            placeholder="Tulis jawaban di sini..."
            value={selectedAnswer || ""}
            onChange={handleEssayChange}
            disabled={disabled}
          />
        </div>
      )}

      <button
        className={`btn btn-sm flag-button ${isFlagged ? "btn-warning" : "btn-outline"}`}
        onClick={handleFlagToggle}
        disabled={disabled}
        type="button"
      >
        {isFlagged ? "✅ Lepas Ragu" : "🚩 Tandai Ragu"}
      </button>
    </div>
  );
}
