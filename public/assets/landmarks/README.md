# Landmark sprites (the buildings on the world map)

Drop a PNG here named **exactly** after each career's slug and it will appear on
the map automatically. No code changes needed. If a file is missing, the game
falls back to the built-in drawn building, so you can add them one at a time.

## Filenames (must match exactly)

| File                            | Career on the map        |
| ------------------------------- | ------------------------ |
| `culinary-arts.png`             | Culinary Arts            |
| `information-technology.png`    | Information Technology   |
| `health-sciences.png`          | Health Sciences          |
| `law-government.png`            | Law & Government          |
| `media-communication.png`       | Media & Communication    |
| `financial-services.png`        | Financial Services       |
| `education.png`                 | Education                |
| `arts-entertainment.png`        | Arts, Entertainment & Design |

## Format

- **PNG with a transparent background** (no white box behind the building).
- Roughly **square**, ~256×256 up to 512×512 px (drawn at ~124px on screen, so
  2–4× gives a crisp, retina/app-store-ready look).
- Compose the building **sitting on the ground at the bottom-center** of the
  image (it's anchored bottom-center). A little grass/base under it looks great.
- Keep the 8 in a **consistent style and scale** so the map looks cohesive.

A matching `assets/map/island.png` and `assets/map/sea.png` can be added later
for a fully illustrated map — ask and I'll wire those in too.
