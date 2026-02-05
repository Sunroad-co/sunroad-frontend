# Public Assets Inventory & Usage Map

**Generated:** 2026-02-05  
**Purpose:** Pre-launch bandwidth optimization audit

## Summary

- **Total images found:** 20 files
- **Total size (before optimization):** ~2,200 KB
- **High priority targets:** 7 files (>80KB or hero assets)

---

## High Priority Assets (>80KB or Hero)

| Path | Format | Size (KB) | Dimensions | Priority | Usage Locations |
|------|--------|-----------|------------|----------|-----------------|
| `Sun-Road-Logo-svg.svg` | SVG | **828** | N/A (embedded raster) | 🔴 **CRITICAL** | `components/home/ReactiveWallHeroV2.tsx`, `components/home/CoLockup.tsx`, `components/featured-blog.tsx` |
| `sunroad_artwork.png` | PNG | **312** | 1128×1144 | 🔴 **HIGH** | `components/auth-layout.tsx`, `components/BrandManifesto.tsx` |
| `sunroad-building-art.png` | PNG | **264** | 1280×1280 | 🔴 **HIGH** | `components/footer.tsx` |
| `heroart/woman_color.png` | PNG | **140** | 335×484 | 🟡 **MEDIUM** (hero) | `components/BrandManifesto.tsx` |
| `heroart/man_color.png` | PNG | **120** | 331×484 | 🟡 **MEDIUM** (hero) | `components/BrandManifesto.tsx` |
| `header_guitar_man.jpg` | JPG | **100** | 761×479 | 🟡 **MEDIUM** | Not currently used (may be legacy) |
| `heroart/woman_bw.png` | PNG | **92** | 336×484 | 🟡 **MEDIUM** (hero) | `components/BrandManifesto.tsx` |
| `heroart/man_bw.png` | PNG | **92** | 331×484 | 🟡 **MEDIUM** (hero) | `components/BrandManifesto.tsx` |

**Total high priority:** ~1,940 KB

---

## Medium Priority Assets (20-80KB)

| Path | Format | Size (KB) | Dimensions | Usage Locations |
|------|--------|-----------|------------|-----------------|
| `logos_crystal_museum.png` | PNG | 48 | 374×161 | `components/auth-layout.tsx`, `components/social-proof.tsx` |
| `logos_circle_cinema.png` | PNG | 40 | 394×161 | `components/auth-layout.tsx`, `components/social-proof.tsx` |
| `categories/MUESUM.png` | PNG | 36 | Unknown | Not found in code (may be unused) |
| `categories/GALLERY.png` | PNG | 36 | Unknown | Not found in code (may be unused) |
| `categories/PHOTOGRAPHY.png` | PNG | 32 | Unknown | Not found in code (may be unused) |
| `categories/FINE ARTIST.png` | PNG | 32 | Unknown | Not found in code (may be unused) |
| `categories/VENUE.png` | PNG | 28 | Unknown | Not found in code (may be unused) |
| `sunroad_logo.png` | PNG | 20 | 194×104 | `components/footer.tsx`, `components/login-form.tsx`, `components/navbar.tsx`, `components/BrandManifesto.tsx`, `components/onboarding-form.tsx`, `app/pricing/page.tsx`, `components/mobile-menu-overlay.tsx` |
| `Logos_bob_dylan.png` | PNG | 20 | 607×161 | `components/auth-layout.tsx`, `components/social-proof.tsx` |
| `logos_cains.png` | PNG | 20 | 200×161 | `components/auth-layout.tsx`, `components/social-proof.tsx` |
| `head_guitarist.jpg` | JPG | 20 | 480×386 | `components/home/HeroProduct.tsx` (hero, above-the-fold) |
| `logos_tulsa_balet.png` | PNG | 16 | 205×161 | `components/social-proof.tsx` |

**Total medium priority:** ~328 KB

---

## Low Priority Assets (<20KB)

| Path | Format | Size (KB) | Dimensions | Usage Locations |
|------|--------|-----------|------------|-----------------|
| `sunroad_logo.jpg` | JPG | ~8 | 98×52 | Not found in code (may be unused) |
| `house (2).png` | PNG | 92 | Unknown | Not found in code (may be unused) |

---

## Optimization Strategy

### 1. SVG Logo (`Sun-Road-Logo-svg.svg`)
- **Issue:** Contains embedded base64 PNG raster (4096×4096), making it 828KB
- **Solution:** Extract and convert to WebP at display sizes:
  - Navbar/Footer: 194×104 (or smaller)
  - Hero/Featured: 400×214 (2x for retina)
  - Replace SVG references with WebP

### 2. Large PNG Artwork
- **`sunroad_artwork.png`** (312KB): Convert to WebP quality 88
- **`sunroad-building-art.png`** (264KB): Convert to WebP quality 88

### 3. Hero Art Images
- **`heroart/*.png`** (4 files, ~440KB total): Convert to WebP quality 90 (preserve detail for illustrations)

### 4. Logo Images
- **`sunroad_logo.png`** (20KB): Already small, but can convert to WebP for consistency
- **Social proof logos** (20-48KB): Convert to WebP quality 85

### 5. Category Images
- **`categories/*.png`**: Not found in code - verify if unused before converting

---

## Expected Savings

| Asset Category | Current Size | Estimated WebP Size | Savings |
|----------------|--------------|---------------------|---------|
| SVG Logo (raster replacement) | 828 KB | ~40 KB (2x sizes) | **~788 KB** |
| Large artwork (2 files) | 576 KB | ~180 KB | **~396 KB** |
| Hero art (4 files) | 440 KB | ~150 KB | **~290 KB** |
| Logos & misc | 148 KB | ~60 KB | **~88 KB** |
| **TOTAL** | **~1,992 KB** | **~430 KB** | **~1,562 KB (78%)** |

---

## Code References Summary

### Components using public assets:
1. `components/BrandManifesto.tsx` - Hero art images (4), artwork, logo
2. `components/auth-layout.tsx` - Artwork, social proof logos
3. `components/footer.tsx` - Building art, logo
4. `components/home/HeroProduct.tsx` - Hero guitarist image
5. `components/home/ReactiveWallHeroV2.tsx` - SVG logo
6. `components/home/CoLockup.tsx` - SVG logo
7. `components/featured-blog.tsx` - SVG logo
8. `components/navbar.tsx` - Logo
9. `components/login-form.tsx` - Logo
10. `components/social-proof.tsx` - Social proof logos
11. `components/onboarding-form.tsx` - Logo
12. `app/pricing/page.tsx` - Logo
13. `components/mobile-menu-overlay.tsx` - Logo

---

## Next Steps

1. ✅ Create inventory report (this document)
2. ⏳ Convert SVG logo to WebP at display sizes
3. ⏳ Convert large PNG/JPG to WebP
4. ⏳ Update all code references
5. ⏳ Verify build and visual quality
6. ⏳ Update `PRE_LAUNCH_PERFORMANCE_AUDIT.md`
