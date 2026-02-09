# 🚀 Quick Start Guide

## Test Locally (Right Now!)

1. Open `index.html` in your browser
2. Try the calculator with sample data
3. Make sure everything works as expected

## Deploy to GitHub (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `tc-rescue` (or your choice)
3. Make it Public
4. **Don't** check "Add README" (we have one)
5. Click "Create repository"

### Step 2: Upload Your Code

**Option A: Using the command line**
```bash
# Run the setup script
./setup.sh

# Then follow the instructions to connect to GitHub
git remote add origin https://github.com/YOUR-USERNAME/tc-rescue.git
git branch -M main
git push -u origin main
```

**Option B: Using GitHub Desktop**
1. Download GitHub Desktop
2. File → Add Local Repository
3. Choose this folder
4. Publish to GitHub

**Option C: Upload through web**
1. On your new GitHub repo page, click "uploading an existing file"
2. Drag all files from this folder
3. Click "Commit changes"

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - Source: **GitHub Actions**
   - (It should auto-detect the workflow)
5. Click **Save** if needed

### Step 4: Wait for Deployment

1. Go to **Actions** tab in your repo
2. You'll see "Deploy to GitHub Pages" running
3. Wait ~1 minute for it to complete (green checkmark)
4. Your app is now live!

### Step 5: Get Your URL

Your app will be at:
```
https://YOUR-USERNAME.github.io/tc-rescue/
```

For example, if your GitHub username is `johnsmith`:
```
https://johnsmith.github.io/tc-rescue/
```

## Install on iPhone 📱

1. Open the GitHub Pages URL in **Safari** on your iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon appears on your home screen!

Now it works like a native app:
- ✅ Works offline
- ✅ Fullscreen (no browser UI)
- ✅ Appears in app switcher
- ✅ Fast loading

## Update Your App

Whenever you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

GitHub Actions will automatically redeploy!

## Troubleshooting

**App not loading?**
- Check the Actions tab for deployment status
- Make sure GitHub Pages source is set to "GitHub Actions"
- Wait a minute and hard refresh (Cmd+Shift+R)

**Can't add to home screen?**
- Must use Safari (not Chrome) on iPhone
- Must access via https:// URL
- Try clearing Safari cache

**Icons not showing?**
- They'll appear after adding to home screen
- You can replace `icon-192.png` and `icon-512.png` with custom designs

## Next Steps

✅ Test the app thoroughly  
✅ Customize the icons with your design  
✅ Share the URL with your team  
✅ Consider adding more features  
✅ When ready, start the App Store process (see README.md)

---

**Need help?** Open an issue on GitHub or check the full README.md
