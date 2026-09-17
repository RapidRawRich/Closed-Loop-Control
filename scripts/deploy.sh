#!/usr/bin/env bash
set -e

echo "Building production bundle..."
npm run build

echo "Packaging dist/ into gh-pages branch..."
git add -f dist
TREE_ID=$(git write-tree --prefix=dist)
git reset HEAD dist
COMMIT_ID=$(echo "Deploy to GitHub Pages $(date -u)" | git commit-tree "$TREE_ID")
git branch -f gh-pages "$COMMIT_ID"

echo "Pushing gh-pages branch to origin..."
git push origin gh-pages --force

echo "Deployment complete! Live at: https://rapidrawrich.github.io/Closed-Loop-Control/"
