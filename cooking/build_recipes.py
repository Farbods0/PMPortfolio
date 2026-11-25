#!/usr/bin/env python3
"""
Generates dedicated static recipe pages, shorthand URL alias redirects,
legacy /cooking/recipes/<slug>/ redirects, and updates sitemap.xml
from cooking/data/recipes.json.

Usage:
    python cooking/build_recipes.py
"""
import datetime
import html
import json
import os
import re

SITE_ORIGIN = "https://farbodjahan.com"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COOKING_DIR = os.path.join(REPO_ROOT, "cooking")
DATA_PATH = os.path.join(COOKING_DIR, "data", "recipes.json")
SITEMAP_PATH = os.path.join(REPO_ROOT, "sitemap.xml")


def esc(text: str) -> str:
    return html.escape(text or "", quote=True)


def strip_html(text: str) -> str:
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or ""))).strip()


def to_iso_duration(text: str) -> str:
    """Convert human duration like '20 mins', '2 hours', '2 days' to ISO-8601 duration."""
    if not text:
        return ""
    t = text.lower()
    days = re.search(r"(\d+)\s*day", t)
    hours = re.search(r"(\d+)\s*h(?:our|r)", t)
    mins = re.search(r"(\d+)\s*min", t)
    out = "P"
    if days:
        out += f"{days.group(1)}D"
    time_part = ""
    if hours:
        time_part += f"{hours.group(1)}H"
    if mins:
        time_part += f"{mins.group(1)}M"
    if time_part:
        out += "T" + time_part
    return out if out != "P" else ""


def build_json_ld(recipe: dict) -> str:
    canonical = f"{SITE_ORIGIN}/cooking/{recipe['slug']}/"
    img_url = f"{SITE_ORIGIN}/cooking/{recipe['image']}"
    all_ingredients = [
        item for g in recipe["ingredientGroups"] for item in g["items"]
    ]
    instructions = []
    for sec in recipe["instructionSections"]:
        step_objs = []
        for st in sec["steps"]:
            plain = strip_html(st["html"])
            if not plain or st.get("type") == "subheading":
                continue
            step_objs.append({"@type": "HowToStep", "text": plain})
        if step_objs:
            if sec["title"]:
                instructions.append(
                    {
                        "@type": "HowToSection",
                        "name": sec["title"],
                        "itemListElement": step_objs,
                    }
                )
            else:
                instructions.extend(step_objs)

    schema = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe["title"],
        "description": recipe["description"],
        "image": [img_url],
        "author": {"@type": "Person", "name": "Farbod Jahan", "url": SITE_ORIGIN},
        "url": canonical,
        "recipeCategory": recipe["category"],
        "recipeYield": recipe["yield"],
        "recipeIngredient": all_ingredients,
        "recipeInstructions": instructions,
    }
    prep_iso = to_iso_duration(recipe.get("prepTime", ""))
    total_iso = to_iso_duration(recipe.get("totalTime", ""))
    if prep_iso:
        schema["prepTime"] = prep_iso
    if total_iso:
        schema["totalTime"] = total_iso
    return json.dumps(schema, ensure_ascii=False, indent=2)


def render_ingredients_html(groups: list) -> str:
    if not groups:
        return ""
    multi_col = len(groups) > 1
    blocks = []
    for idx, g in enumerate(groups):
        heading = f"<h5>{esc(g['title'])}</h5>\n" if g.get("title") else ""
        items_html = []
        for i, item in enumerate(g["items"]):
            cb_id = f"ing-{idx}-{i}"
            items_html.append(
                f'<li class="ingredient-item">'
                f'<input type="checkbox" id="{cb_id}" class="ingredient-check" aria-label="Mark ingredient used">'
                f'<label for="{cb_id}">{esc(item)}</label>'
                f"</li>"
            )
        col_cls = "col-md-6" if multi_col else "col-12"
        blocks.append(
            f'<div class="{col_cls} ingredient-group">\n'
            f"  {heading}"
            f'  <ul class="ingredient-list">\n    ' + "\n    ".join(items_html) + "\n  </ul>\n"
            f"</div>"
        )
    return '<div class="row g-3">\n' + "\n".join(blocks) + "\n</div>"


def render_instructions_html(sections: list) -> str:
    blocks = []
    for sec in sections:
        title_html = (
            f'<div class="titleStep"><span>{esc(sec["title"])}</span></div>'
            if sec.get("title")
            else ""
        )
        steps_html = []
        for st in sec["steps"]:
            stype = st.get("type", "step")
            content = st["html"]
            if stype == "subheading":
                steps_html.append(f'<h5 class="step-subheading">{content}</h5>')
            elif "<img " in content:
                steps_html.append(f'<div class="step-media">{content}</div>')
            else:
                extra_cls = " ps-4 step-note" if stype == "note" else ""
                steps_html.append(
                    f'<p class="recipe-step-item{extra_cls}" title="Click to mark step done">{content}</p>'
                )
        blocks.append(
            f'<div class="cardSteps">\n'
            f'  <div class="icon"><iconify-icon icon="ic:round-check-circle-outline"></iconify-icon></div>\n'
            f'  <div class="desciption">\n'
            f"    {title_html}\n"
            + "\n    ".join(steps_html)
            + "\n  </div>\n</div>"
        )
    return "\n".join(blocks)


def render_related_html(recipe: dict, all_recipes: list) -> str:
    same_cat = [
        r for r in all_recipes
        if r["category"] == recipe["category"] and r["slug"] != recipe["slug"]
    ]
    others = [
        r for r in all_recipes
        if r["category"] != recipe["category"] and r["slug"] != recipe["slug"]
    ]
    idx = next((i for i, r in enumerate(all_recipes) if r["slug"] == recipe["slug"]), 0)
    rotated = same_cat[idx % len(same_cat):] + same_cat[: idx % len(same_cat)] if same_cat else []
    picks = (rotated + others)[:3]
    cards = []
    for p in picks:
        cards.append(
            f'<div class="col-md-4">\n'
            f'  <a href="../{esc(p["slug"])}/" class="related-recipe-card">\n'
            f'    <div class="related-img-wrap">\n'
            f'      <img src="../{esc(p["image"])}" alt="{esc(p["title"])}" loading="lazy">\n'
            f'    </div>\n'
            f'    <div class="related-body">\n'
            f'      <span class="recipe-cat-pill">{esc(p["category"])}</span>\n'
            f'      <h4>{esc(p["title"])}</h4>\n'
            f'      <p>{esc(p["description"])}</p>\n'
            f'    </div>\n'
            f'  </a>\n'
            f'</div>'
        )
    return "\n".join(cards)


def render_recipe_page(recipe: dict, all_recipes: list) -> str:
    canonical = f"{SITE_ORIGIN}/cooking/{recipe['slug']}/"
    og_image = f"{SITE_ORIGIN}/cooking/{recipe['image']}"
    title_esc = esc(recipe["title"])
    desc_esc = esc(recipe["description"] or f"{recipe['title']} recipe by Farbod Jahan.")
    json_ld = build_json_ld(recipe)
    ingredients_html = render_ingredients_html(recipe["ingredientGroups"])
    instructions_html = render_instructions_html(recipe["instructionSections"])
    related_html = render_related_html(recipe, all_recipes)

    return f"""<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title_esc} Recipe | Farbod Jahan</title>
    <meta name="description" content="{desc_esc}">
    <link rel="canonical" href="{canonical}">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    <!-- Open Graph / Social Sharing -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title_esc} | Farbod Jahan Recipes">
    <meta property="og:description" content="{desc_esc}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:url" content="{canonical}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title_esc} | Farbod Jahan Recipes">
    <meta name="twitter:description" content="{desc_esc}">
    <meta name="twitter:image" content="{og_image}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Miniver&family=Open+Sans:wght@400;600;700&family=Raleway:wght@300;400;500;600;700&family=Roboto+Slab:wght@400;600;700&display=swap">

    <link href="../../css/style.css" rel="stylesheet">
    <link href="../../css/cooking.css" rel="stylesheet">

    <script type="application/ld+json">
{json_ld}
    </script>
</head>

<body class="cooking-page recipe-detail-page">
    <div class="external-wrapper">
        <!-- HEADER START -->
        <header>
            <nav class="navbar navbar-expand-lg">
                <div class="container">
                    <a class="navbar-brand" href="../../index.html">
                        <img src="../../images/FarbodJahan.png" alt="Farbod Jahan Logo" loading="lazy">
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <button class="closeIcon" aria-label="Close menu">
                            <iconify-icon icon="ep:close"></iconify-icon>
                        </button>
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="../../index.html" aria-label="Home">
                                    <iconify-icon icon="fa:home"></iconify-icon>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="../../about/">About</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="../../resume/">Resume</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="../../contact/">Contact</a>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link active" href="#" data-bs-toggle="dropdown"
                                    aria-expanded="false">Interests</a>
                                <div class="dropdown-menu">
                                    <ul>
                                        <li><a class="dropdownitem" href="../../dj/">Dj</a></li>
                                        <li><a class="dropdownitem" href="../">Cooking</a></li>
                                        <li><a class="dropdownitem" href="../../real-estate/">Real Estate</a></li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
        <!-- HEADER END -->

        <main class="recipe-page-main">
            <div class="container">
                <article class="recipe-surface food-detail">
                    <div class="recipe-topbar">
                        <a href="../#cooking" class="arrowback">
                            <i><iconify-icon icon="cil:arrow-left"></iconify-icon></i>
                            Back to all recipes
                        </a>
                        <div class="recipe-actions">
                            <button type="button" class="recipe-action-btn" id="copy-link-btn" data-url="{canonical}">
                                <iconify-icon icon="mdi:link-variant"></iconify-icon>
                                <span class="btn-label">Copy Link</span>
                            </button>
                            <button type="button" class="recipe-action-btn" id="wake-lock-btn" aria-pressed="false">
                                <iconify-icon icon="mdi:lightbulb-on-outline"></iconify-icon>
                                <span class="btn-label">Keep Awake</span>
                            </button>
                            <button type="button" class="recipe-action-btn" id="print-recipe-btn">
                                <iconify-icon icon="mdi:printer-outline"></iconify-icon>
                                <span class="btn-label">Print</span>
                            </button>
                        </div>
                    </div>

                    <div class="recipe-content-body">
                        <div class="row g-4 align-items-start">
                            <div class="col-lg-5">
                                <div class="img-holder recipe-hero-img">
                                    <img src="../{esc(recipe['image'])}" alt="{title_esc}" fetchpriority="high">
                                </div>
                            </div>
                            <div class="col-lg-7">
                                <span class="recipe-cat-pill">{esc(recipe['category'])}</span>
                                <h1 class="recipe-title">{title_esc}</h1>
                                <p class="recipe-lead">{desc_esc}</p>

                                <div class="row recipe-meta-row">
                                    <div class="col-4">
                                        <div class="cookCard">
                                            <div class="icon">
                                                <iconify-icon icon="teenyicons:stopwatch-outline"></iconify-icon>
                                            </div>
                                            <h4>Prep Time</h4>
                                            <span>{esc(recipe['prepTime'])}</span>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="cookCard">
                                            <div class="icon">
                                                <iconify-icon icon="ic:outline-watch-later"></iconify-icon>
                                            </div>
                                            <h4>Total Time</h4>
                                            <span>{esc(recipe['totalTime'])}</span>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="cookCard">
                                            <div class="icon">
                                                <iconify-icon icon="{esc(recipe['yieldIcon'])}"></iconify-icon>
                                            </div>
                                            <h4>Yield</h4>
                                            <span>{esc(recipe['yield'])}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="ingredients-block">
                                    <div class="section-heading-row">
                                        <h2 class="subTitle">INGREDIENTS</h2>
                                        <span class="interactive-hint">Tap items to check off</span>
                                    </div>
                                    {ingredients_html}
                                </div>
                            </div>
                        </div>

                        <hr>

                        <section class="instructions-block">
                            <div class="section-heading-row">
                                <h2 class="subTitle">INSTRUCTIONS</h2>
                                <span class="interactive-hint">Tap a step to mark complete</span>
                            </div>
                            {instructions_html}
                        </section>
                    </div>
                </article>

                <section class="related-recipes-section">
                    <div class="related-header">
                        <h3>More Recipes</h3>
                        <a href="../#cooking" class="arrowback">View all recipes →</a>
                    </div>
                    <div class="row g-4">
                        {related_html}
                    </div>
                </section>
            </div>
        </main>

        <!-- FOOTER START -->
        <footer>
            <div class="container">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="copyright">
                            © 2010 - 2026 Farbod Jahan
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <ul class="social-link">
                            <li><a href="https://www.facebook.com/farbods0" target="_blank" rel="noopener" aria-label="Facebook">
                                    <iconify-icon icon="dashicons:facebook-alt"></iconify-icon>
                                </a></li>
                            <li><a href="https://www.linkedin.com/in/farbod-jahan" target="_blank" rel="noopener" aria-label="LinkedIn">
                                    <iconify-icon icon="jam:linkedin"></iconify-icon>
                                </a></li>
                            <li><a href="https://www.instagram.com/farbod_jahan/" target="_blank" rel="noopener" aria-label="Instagram">
                                    <iconify-icon icon="fa:instagram"></iconify-icon>
                                </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
        <!-- FOOTER END -->
    </div>

    <div id="loading">
        <div class="loadingio-spinner-rolling-2g1nsf9rz6p">
            <div class="ldio-xo4z6m7kfv">
                <div></div>
            </div>
        </div>
    </div>

    <button class="top-btn" aria-label="Scroll to top">
        <iconify-icon icon="bx:up-arrow-alt"></iconify-icon>
    </button>

    <script src="../../js/bootstrap.bundle.min.js" defer></script>
    <script src="https://unpkg.com/aos@next/dist/aos.js" defer></script>
    <script src="../../js/simpleparallax.js" defer></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.0-beta.3/iconify-icon.min.js" defer></script>
    <script src="../../js/main.js" defer></script>
    <script src="../js/recipe-page.js" defer></script>
</body>

</html>
"""


def render_redirect_page(recipe: dict, target_rel: str) -> str:
    canonical = f"{SITE_ORIGIN}/cooking/{recipe['slug']}/"
    og_image = f"{SITE_ORIGIN}/cooking/{recipe['image']}"
    title_esc = esc(recipe["title"])
    desc_esc = esc(recipe["description"])
    return f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{title_esc} Recipe | Farbod Jahan</title>
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="{canonical}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title_esc} | Farbod Jahan Recipes">
    <meta property="og:description" content="{desc_esc}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:url" content="{canonical}">
    <meta http-equiv="refresh" content="0; url={target_rel}">
    <script>window.location.replace({json.dumps(target_rel)});</script>
</head>
<body style="background:#000;color:#c9ab81;font-family:sans-serif;padding:2rem;">
    <p>Redirecting to <a href="{target_rel}" style="color:#c9ab81;">{title_esc}</a>…</p>
</body>
</html>
"""


def update_sitemap(recipes: list) -> None:
    today = datetime.date.today().isoformat()
    base_urls = [
        (f"{SITE_ORIGIN}/", "1.0"),
        (f"{SITE_ORIGIN}/about/", "0.8"),
        (f"{SITE_ORIGIN}/resume/", "0.8"),
        (f"{SITE_ORIGIN}/contact/", "0.8"),
        (f"{SITE_ORIGIN}/dj/", "0.8"),
        (f"{SITE_ORIGIN}/real-estate/", "0.8"),
        (f"{SITE_ORIGIN}/cooking/", "0.9"),
    ]
    for r in recipes:
        base_urls.append((f"{SITE_ORIGIN}/cooking/{r['slug']}/", "0.8"))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, prio in base_urls:
        lines.append(
            f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{prio}</priority></url>"
        )
    lines.append("</urlset>\n")

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main() -> None:
    with open(DATA_PATH, encoding="utf-8") as f:
        recipes = json.load(f)

    # 1. Generate dedicated recipe pages at /cooking/<slug>/index.html
    generated_pages = 0
    generated_aliases = 0
    generated_legacy = 0

    for recipe in recipes:
        slug_dir = os.path.join(COOKING_DIR, recipe["slug"])
        os.makedirs(slug_dir, exist_ok=True)
        with open(os.path.join(slug_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(render_recipe_page(recipe, recipes))
        generated_pages += 1

        # 2. Generate shorthand alias redirects at /cooking/<alias>/index.html
        for alias in recipe.get("aliases", []):
            if alias == recipe["slug"]:
                continue
            alias_dir = os.path.join(COOKING_DIR, alias)
            os.makedirs(alias_dir, exist_ok=True)
            with open(os.path.join(alias_dir, "index.html"), "w", encoding="utf-8") as f:
                f.write(render_redirect_page(recipe, f"../{recipe['slug']}/"))
            generated_aliases += 1

        # 3. Generate legacy redirect at /cooking/recipes/<legacySlug>/index.html
        legacy = recipe.get("legacySlug")
        if legacy:
            legacy_dir = os.path.join(COOKING_DIR, "recipes", legacy)
            os.makedirs(legacy_dir, exist_ok=True)
            with open(os.path.join(legacy_dir, "index.html"), "w", encoding="utf-8") as f:
                f.write(render_redirect_page(recipe, f"../../{recipe['slug']}/"))
            generated_legacy += 1

    # 4. Update sitemap.xml
    update_sitemap(recipes)

    print(
        f"Built {generated_pages} recipe pages, {generated_aliases} shorthand aliases, "
        f"{generated_legacy} legacy redirects, and updated sitemap.xml."
    )


if __name__ == "__main__":
    main()

