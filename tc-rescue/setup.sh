#!/bin/bash

echo "🎬 TC Rescue - GitHub Setup Script"
echo "=================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "This script will help you set up the repository for GitHub."
echo ""

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files
echo ""
echo "📝 Adding files to Git..."
git add .

# Create initial commit
echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: TC Rescue PWA for calculating audio start timecode"

echo ""
echo "✅ Local repository is ready!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name it 'tc-rescue' (or whatever you prefer)"
echo "   - Don't initialize with README (we already have one)"
echo "   - Click 'Create repository'"
echo ""
echo "2. Connect this repository to GitHub:"
echo "   Run these commands (replace YOUR-USERNAME):"
echo ""
echo "   git remote add origin https://github.com/YOUR-USERNAME/tc-rescue.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to your repository on GitHub"
echo "   - Click Settings → Pages"
echo "   - Under 'Build and deployment' → 'Source'"
echo "   - Select 'GitHub Actions'"
echo "   - The deployment workflow will run automatically!"
echo ""
echo "4. Your app will be live at:"
echo "   https://YOUR-USERNAME.github.io/tc-rescue/"
echo ""
echo "5. Install on iPhone:"
echo "   - Open the URL in Safari"
echo "   - Tap Share → Add to Home Screen"
echo ""
echo "Need help? Check the README.md file for more details!"
