"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";
import { MAPEL_LIST } from "@/lib/constants";

interface SubjectStat {
  slug: string;
  name: string;
  totalSessions: number;
  completedSessions: number;
}

export default function HasilPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Map<string, SubjectStat>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const results = await Promise.all(
          MAPEL_LIST.map(async (mapel) => {
            try {
              const res = await fetch(`/api/admin/hasil/${mapel.slug}`);
              if (!res.ok) return null;
              const data = await res.json();
              return {
                slug: mapel.slug,
                name: mapel.name,
                totalSessions: data.totalStudents || 0,
                completedSessions: data.sessions?.length || 0,
              };
            } catch {
              return null;
            }
          })
        );

        const map = new Map<string, SubjectStat>();
        results.forEach((r) => {
          if (r) map.set(r.slug, r);
        });
        setStats(map);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <LayoutAdmin title="Hasil Ujian">
      <div className="admin-header">
        <h3>Pilih Mata Pelajaran</h3>
        <p style={{ color: "var(--teks-abu)", marginTop: 4 }}>
          Klik mapel untuk melihat hasil ujian siswa
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Memuat data mapel...</p>
        </div>
      ) : (
        <div className="mapel-grid">
          {MAPEL_LIST.map((mapel) => {
            const stat = stats.get(mapel.slug);
            const total = stat?.totalSessions ?? 0;
            const completed = stat?.completedSessions ?? 0;

            return (
              <button
                key={mapel.slug}
                className="mapel-card"
                onClick={() => router.push(`/admin/hasil/${mapel.slug}`)}
              >
                <div className="mapel-card-icon">
                  <span>📋</span>
                </div>
                <div className="mapel-card-body">
                  <h4>{mapel.name}</h4>
                  <div className="mapel-card-stats">
                    <span className="stat-badge stat-completed">
                      ✅ {completed} selesai
                    </span>
                    <span className="stat-badge stat-total">
                      👥 {total} total
                    </span>
                  </div>
                </div>
                <div className="mapel-card-action">
                  <span className="btn btn-sm btn-hijau">Lihat Hasil</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </LayoutAdmin>
  );
}
