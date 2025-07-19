# 3. Déplacer les fichiers docs (exemple)
mkdir -Force docs
git mv TECHNICAL_ARCHITECTURE.md docs\
git mv PROJECT_INSTRUCTIONS.md docs\
git mv DEVELOPMENT_ROADMAP.md docs\
git mv QUICK_COMMANDS.md docs\
git mv UPDATES_SUMMARY.md docs\
git mv COMMON_ISSUES.md docs\
git mv COMPONENT_LIBRARY.md docs\

# 4. Ajouter et committer
git add supabase/migrations/000_init.sql docs/
git commit -m "chore(db): baseline profiles/trigger + move docs to /docs"

# 5. Pousser sur ta branche en cours
git push -u origin refactor/baseline
