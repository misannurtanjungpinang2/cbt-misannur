#!/bin/bash
# =======================================================
# DEPLOY SCRIPT — CBT MIS An-Nur
# Deploy otomatis ke GitHub + Vercel + Supabase
# =======================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "=========================================="
echo "  DEPLOY CBT MIS AN-NUR"
echo "  https://cbt-misannur.vercel.app"
echo "=========================================="
echo -e "${NC}"

# ----- CEK PRASYARAT -----
echo -e "${YELLOW}[1/7] Cek prasyarat...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js tidak ditemukan. Install dulu: https://nodejs.org${NC}"
    exit 1
fi
if ! command -v git &> /dev/null; then
    echo -e "${RED}ERROR: Git tidak ditemukan. Install dulu: https://git-scm.com${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"
echo -e "  ${GREEN}✓${NC} Git $(git --version | awk '{print $3}')"

# ----- INPUT KREDENSIAL -----
echo ""
echo -e "${YELLOW}[2/7] Masukkan kredensial yang diperlukan...${NC}"
echo -e "  (Jika sudah diisi sebelumnya, Enter untuk pakai nilai default)"
echo ""

read -p "  GitHub Username [misannurtanjungpinang2]: " GH_USER
GH_USER=${GH_USER:-misannurtanjungpinang2}

read -s -p "  GitHub Token: " GH_TOKEN
echo ""

read -s -p "  Supabase Database Password: " SUPABASE_PASS
echo ""

read -p "  Supabase Project Ref [uluhtaolhxdxragtcdem]: " SUPABASE_REF
SUPABASE_REF=${SUPABASE_REF:-uluhtaolhxdxragtcdem}

read -s -p "  Vercel Token: " VERCEL_TOKEN
echo ""

# Validasi input
if [ -z "$GH_TOKEN" ]; then echo -e "${RED}ERROR: GitHub Token wajib diisi${NC}"; exit 1; fi
if [ -z "$SUPABASE_PASS" ]; then echo -e "${RED}ERROR: Supabase Password wajib diisi${NC}"; exit 1; fi
if [ -z "$VERCEL_TOKEN" ]; then echo -e "${RED}ERROR: Vercel Token wajib diisi${NC}"; exit 1; fi

# ----- SETUP GIT & PUSH KE GITHUB -----
echo ""
echo -e "${YELLOW}[3/7] Setup Git dan push ke GitHub...${NC}"

# Hapus git lama jika ada
rm -rf .git

git init -b main
git config user.name "$GH_USER"
git config user.email "$GH_USER@users.noreply.github.com"

# Cek apakah repo sudah ada di GitHub
REPO_URL="https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/cbt-misannur.git"
if git ls-remote "$REPO_URL" &>/dev/null; then
    echo -e "  ${YELLOW}⚠ Repo sudah ada, fetch dulu...${NC}"
    git remote add origin "$REPO_URL"
    git fetch origin
    git reset --soft origin/main 2>/dev/null || true
else
    echo -e "  ${GREEN}✓${NC} Repo belum ada, akan dibuat...${NC}"
    # Buat repo via GitHub API
    curl -s -H "Authorization: token $GH_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         -d '{"name":"cbt-misannur","private":false}' \
         https://api.github.com/user/repos > /dev/null
    git remote add origin "$REPO_URL"
fi

git add -A
git commit -m "Deploy CBT MIS An-Nur $(date +%Y-%m-%d)" 2>/dev/null || echo -e "  ${YELLOW}⚠ Tidak ada perubahan baru${NC}"

# Push (force jika perlu)
git push -u origin main --force 2>&1 || {
    echo -e "${RED}ERROR: Gagal push ke GitHub. Cek token dan koneksi.${NC}"
    exit 1
}
echo -e "  ${GREEN}✓${NC} Kode berhasil di-push ke GitHub"

# ----- BUILD CHECK -----
echo ""
echo -e "${YELLOW}[4/7] Build check lokal...${NC}"
npm run build 2>&1 | tail -5
echo -e "  ${GREEN}✓${NC} Build lokal selesai"

# ----- SETUP VERCEL -----
echo ""
echo -e "${YELLOW}[5/7] Setup Vercel...${NC}"

# Install Vercel CLI jika belum
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

# Set environment variables di Vercel
SUPABASE_URL="postgresql://postgres:$SUPABASE_PASS@db.$SUPABASE_REF.supabase.co:5432/postgres"

echo -e "  ${CYAN}  Setting environment variables...${NC}"
vercel env rm DATABASE_URL production --token "$VERCEL_TOKEN" --yes 2>/dev/null || true
echo "$SUPABASE_URL" | vercel env add DATABASE_URL production --token "$VERCEL_TOKEN" --yes

vercel env rm DATABASE_PROVIDER production --token "$VERCEL_TOKEN" --yes 2>/dev/null || true
echo "postgresql" | vercel env add DATABASE_PROVIDER production --token "$VERCEL_TOKEN" --yes

# Deploy ke Vercel
echo -e "  ${CYAN}  Deploy ke Vercel...${NC}"
DEPLOY_URL=$(vercel --prod --token "$VERCEL_TOKEN" --yes 2>&1 | grep -oP 'https?://[^\s]+' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${YELLOW}  ⚠ Tidak dapat URL dari output, cek dashboard Vercel${NC}"
    DEPLOY_URL="https://cbt-misannur.vercel.app"
fi
echo -e "  ${GREEN}✓${NC} Deploy ke: $DEPLOY_URL"

# ----- SETUP DATABASE -----
echo ""
echo -e "${YELLOW}[6/7] Setup database Supabase...${NC}"

# Simpan URL ke .env.local untuk seed
echo "DATABASE_URL=$SUPABASE_URL" > .env.local
echo "DATABASE_PROVIDER=postgresql" >> .env.local

# Generate Prisma client
npx prisma generate 2>&1 | tail -3
echo -e "  ${GREEN}✓${NC} Prisma client generated"

# Push schema
npx prisma db push --accept-data-loss 2>&1 | tail -3
echo -e "  ${GREEN}✓${NC} Schema pushed ke database"

# Seed data (dengan override env)
DATABASE_URL="$SUPABASE_URL" DATABASE_PROVIDER="postgresql" npx tsx prisma/seed.ts 2>&1
echo -e "  ${GREEN}✓${NC} Data seeded (admin + 4 mapel + 169 soal)"

# ----- SELESAI -----
echo ""
echo -e "${GREEN}=========================================="
echo "  DEPLOY SELESAI! 🎉"
echo "=========================================="
echo -e "${NC}"
echo ""
echo -e "  ${CYAN}Aplikasi:${NC}    $DEPLOY_URL"
echo -e "  ${CYAN}Admin:${NC}       $DEPLOY_URL/admin"
echo -e "  ${CYAN}Username:${NC}    admin"
echo -e "  ${CYAN}Password:${NC}    MISANNUR1234"
echo ""
echo -e "  ${YELLOW}Langkah selanjutnya:${NC}"
echo "  1. Buka $DEPLOY_URL/admin"
echo "  2. Login: admin / MISANNUR1234"
echo "  3. Atur token & aktifkan mapel di menu Atur"
echo "  4. Buka halaman utama untuk login siswa"
echo ""
echo -e "  ${CYAN}File .env.local${NC} tersimpan untuk referensi."
echo ""
