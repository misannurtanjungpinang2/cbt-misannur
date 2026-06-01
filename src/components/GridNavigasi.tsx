"use client";

import React from "react";

interface GridNavigasiProps {
  totalSoal: number;
  currentNomor: number;
  answered: (number | string)[];
  flagged: (number | string)[];
  onClick: (nomor: number) => void;
}

export default function GridNavigasi({
  totalSoal,
  currentNomor,
  answered,
  flagged,
  onClick,
}: GridNavigasiProps) {
  // Build a lookup set for O(1) checks
  const answeredSet = new Set(answered.map(String));
  const flaggedSet = new Set(flagged.map(String));

  // Soal numbers are 1-indexed in display, 0-indexed in array
  const soalIndices = Array.from({ length: totalSoal }, (_, i) => i);

  return (
    <div className="sidebar no-print">
      <h4>📋 Navigasi Soal</h4>
      <div className="number-grid">
        {soalIndices.map((idx) => {
          const nomor = idx + 1;
          const isActive = idx === currentNomor;
          const isAnswered = answeredSet.has(String(nomor));
          const isFlagged = flaggedSet.has(String(nomor));

          const classNames = [
            "grid-item",
            isActive ? "active" : "",
            isAnswered ? "answered" : "",
            isFlagged ? "flagged" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <span
              key={idx}
              className={classNames}
              onClick={() => onClick(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(idx);
                }
              }}
              title={`Soal ${nomor}${isAnswered ? " (Terjawab)" : ""}${isFlagged ? " (Ragu)" : ""}${isActive ? " (Aktif)" : ""}`}
            >
              {nomor}
            </span>
          );
        })}
      </div>
    </div>
  );
}
