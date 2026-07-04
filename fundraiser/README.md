# 🚗🔥 Car Repair Fundraiser Site

A simple, good-looking one-page fundraiser website — your story, photos, a video
message, a progress bar toward your **$9,000** goal, and an updates timeline to keep
donors posted as the car gets fixed.

Everything you need to change lives in **one block at the top of `index.html`** called
`CONFIG`. You don't need to know how to code — just replace the text between the quotes.

---

## ⚡ 5-minute setup

Open `index.html` in any text editor and find the section marked
`▼▼▼ CONFIG — EDIT THIS SECTION ▼▼▼`. Change these:

### 1. Add your donate link
This is the most important step — it's how people actually give you money.

Pick **one**:

- **PayPal** (easiest, free to set up):
  1. Go to **paypal.com/paypalme** and create your PayPal.Me link (e.g. `paypal.me/yourname`).
  2. Paste it into `donateUrl` in CONFIG. You can even pre-fill an amount: `https://www.paypal.com/paypalme/yourname/50`.
- **Stripe** (also great, small % fee per donation):
  1. In your Stripe Dashboard create a **Payment Link**.
  2. Paste that link into `donateUrl`.

```js
donateUrl: "https://www.paypal.com/paypalme/yourname",
```

### 2. Add your video message
1. Upload your video to **YouTube** (you can set it to "Unlisted" if you don't want it public in search) or **Vimeo**.
2. Copy the normal link and paste it into `videoUrl`:

```js
videoUrl: "https://youtu.be/YOUR_VIDEO_ID",
```

### 3. Add your photos
1. Put your image files in the **`photos/`** folder.
2. Name your main/hero photo **`1.jpg`** — it shows at the top automatically.
3. List each photo in the `photos:` array in CONFIG:

```js
photos: [ "photos/1.jpg", "photos/2.jpg", "photos/3.jpg" ],
```
*(JPG or PNG both work. If a photo is missing, the page still looks fine — it just shows a placeholder.)*

### 4. Edit your story
Change the text in the `story:` and `subtitle:` fields to tell what happened in your own words.

---

## 🔄 Keeping it updated

### Updating the money raised
Because donations go straight to your PayPal/Stripe, the site can't count them
automatically. When money comes in, just update these two numbers in CONFIG and re-save:

```js
raised: 1250,      // total received so far
donorCount: 14,    // how many people have given (optional)
```
The progress bar updates itself from these.

### Posting a progress update
Each time something happens (got the estimate, parts ordered, car back from the shop…),
add a new entry to the **top** of the `updates:` list:

```js
updates: [
  { date: "Week 3", title: "Car is back!", body: "It's fixed and running. Thank you all!", photo: "photos/fixed.jpg" },
  { date: "Week 1", title: "Got the estimate", body: "The shop quoted $8,700 for the repairs.", photo: "" },
  { date: "Day 1",  title: "Fundraiser launched", body: "Thank you for being here.", photo: "" }
]
```
`photo` is optional — drop the image in `photos/` and reference it, or leave it `""`.

---

## 🌐 Putting it online (so you can share the link)

Both options are **free**. Pick one:

### Option A — Netlify Drop (fastest, no account needed to try)
1. Go to **app.netlify.com/drop**.
2. Drag the whole **`fundraiser`** folder onto the page.
3. You instantly get a live link like `https://your-site.netlify.app` to share.
4. To update later, drag the folder again (or connect it to GitHub for auto-updates).

### Option B — GitHub Pages (free, versioned)
1. Push this repo to GitHub.
2. Repo **Settings → Pages → Deploy from a branch**.
3. Pick your branch and the `/fundraiser` folder (or move the files to the repo root).
4. Your site goes live at `https://yourusername.github.io/tc-rescue/`.

Once it's live, use the **Share** and **Copy link** buttons on the page to spread it on
text, email, and social media. Sharing is the single biggest thing that grows donations.

---

## 💡 Tips for a successful fundraiser
- **Lead with a photo** of the burned car — it makes the need real.
- **Keep the video short** (60–90 seconds), look at the camera, say what happened and what the money is for.
- **Post updates often.** People who donated love seeing progress, and it encourages more sharing.
- **Thank people publicly** in your updates (first names only unless they're okay with more).
- Consider **also** running an official campaign on **gofundme.com** — it adds donor trust and handles payouts, and you can link this page to it.

---

## Files
```
fundraiser/
├── index.html     ← the whole site (edit the CONFIG block at the top)
├── photos/        ← put your images here (1.jpg = main photo)
└── README.md      ← this guide
```
