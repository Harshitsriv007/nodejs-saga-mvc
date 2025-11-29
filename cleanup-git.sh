#!/bin/bash

echo "🧹 Cleaning up Git repository..."
echo ""
echo "⚠️  WARNING: This will remove node_modules and log files from git tracking"
echo "   (Your local files will NOT be deleted)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Step 1: Removing log files from git tracking..."
git rm --cached combined.log error.log 2>/dev/null && echo "✅ Log files removed" || echo "ℹ️  Log files not tracked"

echo ""
echo "Step 2: Removing node_modules from git tracking..."
echo "   This may take a moment (found ~7950 files)..."

# Remove main node_modules
if [ -d "node_modules" ]; then
    git rm -r --cached node_modules/ 2>/dev/null && echo "✅ Main node_modules removed"
fi

# Remove microservices node_modules
for service in microservices/*/; do
    if [ -d "${service}node_modules" ]; then
        echo "   Removing ${service}node_modules..."
        git rm -r --cached "${service}node_modules/" 2>/dev/null
    fi
done

echo ""
echo "Step 3: Checking for other unnecessary files..."

# Check for .DS_Store
if git ls-files | grep -q ".DS_Store"; then
    echo "   Removing .DS_Store files..."
    git ls-files | grep ".DS_Store" | xargs git rm --cached 2>/dev/null
fi

# Check for package-lock.json in microservices
for service in microservices/*/; do
    if [ -f "${service}package-lock.json" ]; then
        echo "   Removing ${service}package-lock.json..."
        git rm --cached "${service}package-lock.json" 2>/dev/null
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
git status --short | head -20
echo ""
echo "Next steps:"
echo "1. Review all changes: git status"
echo "2. Stage .gitignore: git add .gitignore"
echo "3. Commit changes: git commit -m 'Remove node_modules and logs from git tracking'"
echo ""
echo "💡 Tip: The commit will be large. This is normal when removing node_modules."
