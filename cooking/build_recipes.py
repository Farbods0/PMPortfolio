#!/usr/bin/env python3
"""
Generates:
  1. Dedicated All-Recipes directory page at /cooking/recipes/index.html
  2. Dedicated recipe pages at /cooking/<slug>/index.html
  3. Shorthand URL alias redirects at /cooking/<alias>/index.html
  4. Legacy redirects at /cooking/recipes/<legacySlug>/index.html
  5. Updated sitemap.xml

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

FAVICON_LINKS = """    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">"""

FONT_LINKS = """    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Miniver&family=Open+Sans:wght@400;600;700&family=Raleway:wght@300;400;500;600;700&family=Roboto+Slab:wght@400;600;700&display=swap">"""


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
        blocks.append(
            f'<div class="ingredient-group">\n'
            f"  {heading}"
            f'  <ul class="ingredient-list">\n    ' + "\n    ".join(items_html) + "\n  </ul>\n"
            f"</div>"
        )
    return "\n".join(blocks)


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


def render_navbar(root_prefix: str, cooking_href: str) -> str:
    return f"""        <!-- HEADER START -->
        <header>
            <nav class="navbar navbar-expand-lg">
                <div class="container">
                    <a class="navbar-brand" href="{root_prefix}index.html">
                        <img src="{root_prefix}images/FarbodJahan.png" alt="Farbod Jahan Logo" loading="lazy">
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
                                <a class="nav-link" href="{root_prefix}index.html" aria-label="Home">
                                    <iconify-icon icon="fa:home"></iconify-icon>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="{root_prefix}about/">About</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="{root_prefix}resume/">Resume</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="{root_prefix}contact/">Contact</a>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link active" href="#" data-bs-toggle="dropdown"
                                    aria-expanded="false">Interests</a>
                                <div class="dropdown-menu">
                                    <ul>
                                        <li><a class="dropdownitem" href="{root_prefix}dj/">Dj</a></li>
                                        <li><a class="dropdownitem" href="{cooking_href}">Cooking</a></li>
                                        <li><a class="dropdownitem" href="{root_prefix}real-estate/">Real Estate</a></li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
        <!-- HEADER END -->"""


def render_footer() -> str:
    return """        <!-- FOOTER START -->
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
        <!-- FOOTER END -->"""


def render_all_recipes_page(recipes: list) -> str:
    canonical = f"{SITE_ORIGIN}/cooking/recipes/"
    og_image = f"{SITE_ORIGIN}/cooking/assets/optimized/cooking.webp"
    total_count = len(recipes)
    cat_counts = {"Appetizer": 0, "Entree": 0, "Dessert": 0, "Drinks": 0}
    for r in recipes:
        if r["category"] in cat_counts:
            cat_counts[r["category"]] += 1

    # Server-rendered initial grid so it renders immediately without JS flicker and is 100% crawlable
    initial_cards = []
    for r in recipes:
        initial_cards.append(
            f'        <div class="col-md-6 col-lg-4">\n'
            f'            <a class="card-food card-food-link dir-card" href="../{esc(r["slug"])}/">\n'
            f'                <div class="imgTitle">\n'
            f'                    <div class="img-wrapper">\n'
            f'                        <img src="../{esc(r["image"])}" alt="{esc(r["title"])}" loading="lazy">\n'
            f'                        <span class="card-cat-badge">{esc(r["category"])}</span>\n'
            f'                    </div>\n'
            f'                </div>\n'
            f'                <div class="cardBody">\n'
            f'                    <h2 class="title">{esc(r["title"])}</h2>\n'
            f'                    <p class="card-desc">{esc(r["description"])}</p>\n'
            f'                    <div class="card-meta-footer">\n'
            f'                        <span class="card-time">\n'
            f'                            <iconify-icon icon="ic:outline-watch-later"></iconify-icon>\n'
            f'                            {esc(r["totalTime"] or r["prepTime"])}\n'
            f'                        </span>\n'
            f'                        <span class="btn-read">View Recipe →</span>\n'
            f'                    </div>\n'
            f'                </div>\n'
            f'            </a>\n'
            f'        </div>'
        )
    cards_html = "\n".join(initial_cards)

    return f"""<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>All Recipes ({total_count}) | Farbod Jahan</title>
    <meta name="description" content="Browse all {total_count} homemade recipes by Farbod Jahan. Filter by appetizer, entree, dessert, cooking time, or ingredient.">
    <link rel="canonical" href="{canonical}">
{FAVICON_LINKS}

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="All Recipes | Farbod Jahan">
    <meta property="og:description" content="Browse all {total_count} homemade recipes — filter by category, time, or ingredient.">
    <meta property="og:image" content="{og_image}">
    <meta property="og:url" content="{canonical}">

    <!-- Fonts -->
{FONT_LINKS}

    <link href="../../css/style.css" rel="stylesheet">
    <link href="../../css/cooking.css" rel="stylesheet">
</head>

<body class="cooking-page recipes-directory-page">
    <div class="external-wrapper">
{render_navbar("../../", "../")}

        <main class="recipes-dir-main">
            <div class="container">
                <div class="dir-header">
                    <nav class="recipe-breadcrumb" aria-label="Breadcrumb">
                        <a href="../">Cooking</a>
                        <span class="crumb-sep">/</span>
                        <span aria-current="page">All Recipes</span>
                    </nav>
                    <h1 class="dir-title">All Recipes</h1>
                    <p class="dir-subtitle">Browse all {total_count} recipes at a glance — search by dish or ingredient, or filter by course and cook time.</p>
                </div>

                <div class="dir-controls-bar">
                    <div class="dir-controls-top">
                        <div class="recipe-search-wrap dir-search-wrap">
                            <iconify-icon icon="mdi:magnify" class="search-icon"></iconify-icon>
                            <input id="dir-search-input" type="search" class="form-control recipe-search-input"
                                placeholder="Search dishes or ingredients (e.g., pumpkin, garlic, ramen)..."
                                aria-label="Search dishes or ingredients">
                            <button type="button" id="dir-search-clear" class="search-clear-btn"
                                aria-label="Clear search" hidden>
                                <iconify-icon icon="ep:close"></iconify-icon>
                            </button>
                        </div>

                        <div class="dir-selects">
                            <select id="dir-time-filter" class="dir-select" aria-label="Filter by total time">
                                <option value="all">Any time</option>
                                <option value="quick">Quick (≤ 45 mins)</option>
                                <option value="medium">1 – 3 hours</option>
                                <option value="long">Long projects (3+ hrs)</option>
                            </select>
                            <select id="dir-sort-select" class="dir-select" aria-label="Sort recipes">
                                <option value="featured">Featured order</option>
                                <option value="alpha">A – Z</option>
                                <option value="quickest">Quickest first</option>
                            </select>
                        </div>
                    </div>

                    <div class="dir-controls-bottom">
                        <div class="recipe-filter-pills" role="tablist" aria-label="Filter recipes by category">
                            <button type="button" class="filter-pill dir-cat-pill is-active" data-category="All" role="tab" aria-selected="true">
                                All <span class="pill-count">{total_count}</span>
                            </button>
                            <button type="button" class="filter-pill dir-cat-pill" data-category="Appetizer" role="tab" aria-selected="false">
                                Appetizer <span class="pill-count">{cat_counts['Appetizer']}</span>
                            </button>
                            <button type="button" class="filter-pill dir-cat-pill" data-category="Entree" role="tab" aria-selected="false">
                                Entree <span class="pill-count">{cat_counts['Entree']}</span>
                            </button>
                            <button type="button" class="filter-pill dir-cat-pill" data-category="Dessert" role="tab" aria-selected="false">
                                Dessert <span class="pill-count">{cat_counts['Dessert']}</span>
                            </button>
                            <button type="button" class="filter-pill dir-cat-pill" data-category="Drinks" role="tab" aria-selected="false">
                                Drinks <span class="pill-count">{cat_counts['Drinks']}</span>
                            </button>
                        </div>
                        <p id="dir-recipes-count" class="recipes-count" aria-live="polite">Showing all {total_count} recipes</p>
                    </div>
                </div>

                <div id="dir-empty-state" class="recipes-empty-state" hidden>
                    <p>No recipes matched your filters.</p>
                    <button type="button" id="dir-reset-btn" class="recipe-action-btn">Reset all filters</button>
                </div>

                <div id="all-recipes-grid" class="row g-4 dir-grid">
{cards_html}
                </div>
            </div>
        </main>

{render_footer()}
    </div>

    <button class="top-btn" aria-label="Scroll to top">
        <iconify-icon icon="bx:up-arrow-alt"></iconify-icon>
    </button>

    <script src="../../js/bootstrap.bundle.min.js" defer></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.0-beta.3/iconify-icon.min.js" defer></script>
    <script src="../../js/main.js" defer></script>
    <script src="../js/all-recipes.js" defer></script>
</body>

</html>
"""


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
{FAVICON_LINKS}

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
{FONT_LINKS}

    <link href="../../css/style.css" rel="stylesheet">
    <link href="../../css/cooking.css" rel="stylesheet">

    <script type="application/ld+json">
{json_ld}
    </script>
</head>

<body class="cooking-page recipe-detail-page">
    <div class="external-wrapper">
{render_navbar("../../", "../")}

        <main class="recipe-page-main">
            <div class="container">
                <article class="recipe-surface food-detail">
                    <div class="recipe-topbar">
                        <nav class="recipe-breadcrumb" aria-label="Breadcrumb">
                            <a href="../">Cooking</a>
                            <span class="crumb-sep">/</span>
                            <a href="../recipes/">All Recipes</a>
                            <span class="crumb-sep">/</span>
                            <span aria-current="page">{title_esc}</span>
                        </nav>
                        <div class="recipe-actions">
                            <button type="button" class="recipe-action-btn" id="reset-checks-btn" hidden>
                                <iconify-icon icon="mdi:restore"></iconify-icon>
                                <span class="btn-label">Reset Checks</span>
                            </button>
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
                        <div class="row g-4 align-items-center recipe-hero-row">
                            <div class="col-lg-5">
                                <div class="img-holder recipe-hero-img">
                                    <img src="../{esc(recipe['image'])}" alt="{title_esc}" fetchpriority="high">
                                </div>
                            </div>
                            <div class="col-lg-7">
                                <a href="../recipes/?category={esc(recipe['category'])}" class="recipe-cat-pill recipe-cat-link">{esc(recipe['category'])}</a>
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
                            </div>
                        </div>

                        <hr>

                        <div class="row g-5 recipe-cooking-columns">
                            <aside class="col-lg-4 recipe-ingredients-col">
                                <div class="ingredients-sticky-card">
                                    <div class="section-heading-row">
                                        <h2 class="subTitle">INGREDIENTS</h2>
                                        <span class="interactive-hint">Tap to check off</span>
                                    </div>
                                    {ingredients_html}
                                </div>
                            </aside>

                            <section class="col-lg-8 instructions-block">
                                <div class="section-heading-row">
                                    <h2 class="subTitle">INSTRUCTIONS</h2>
                                    <span class="interactive-hint">Tap a step to mark done</span>
                                </div>
                                {instructions_html}
                            </section>
                        </div>
                    </div>
                </article>

                <section class="related-recipes-section">
                    <div class="related-header">
                        <h3>More Recipes</h3>
                        <a href="../recipes/" class="arrowback">Browse all {len(all_recipes)} recipes →</a>
                    </div>
                    <div class="row g-4">
                        {related_html}
                    </div>
                </section>
            </div>
        </main>

{render_footer()}
    </div>

    <button class="top-btn" aria-label="Scroll to top">
        <iconify-icon icon="bx:up-arrow-alt"></iconify-icon>
    </button>

    <script src="../../js/bootstrap.bundle.min.js" defer></script>
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
        (f"{SITE_ORIGIN}/cooking/recipes/", "0.9"),
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

    # 1. Generate dedicated All-Recipes directory at /cooking/recipes/index.html
    recipes_index_dir = os.path.join(COOKING_DIR, "recipes")
    os.makedirs(recipes_index_dir, exist_ok=True)
    with open(os.path.join(recipes_index_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(render_all_recipes_page(recipes))

    # 2. Generate dedicated recipe pages, aliases, and legacy redirects
    generated_pages = 0
    generated_aliases = 0
    generated_legacy = 0

    for recipe in recipes:
        slug_dir = os.path.join(COOKING_DIR, recipe["slug"])
        os.makedirs(slug_dir, exist_ok=True)
        with open(os.path.join(slug_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(render_recipe_page(recipe, recipes))
        generated_pages += 1

        for alias in recipe.get("aliases", []):
            if alias == recipe["slug"]:
                continue
            alias_dir = os.path.join(COOKING_DIR, alias)
            os.makedirs(alias_dir, exist_ok=True)
            with open(os.path.join(alias_dir, "index.html"), "w", encoding="utf-8") as f:
                f.write(render_redirect_page(recipe, f"../{recipe['slug']}/"))
            generated_aliases += 1

        legacy = recipe.get("legacySlug")
        if legacy:
            legacy_dir = os.path.join(COOKING_DIR, "recipes", legacy)
            os.makedirs(legacy_dir, exist_ok=True)
            with open(os.path.join(legacy_dir, "index.html"), "w", encoding="utf-8") as f:
                f.write(render_redirect_page(recipe, f"../../{recipe['slug']}/"))
            generated_legacy += 1

    update_sitemap(recipes)

    print(
        f"Built /cooking/recipes/ directory, {generated_pages} recipe pages, "
        f"{generated_aliases} shorthand aliases, {generated_legacy} legacy redirects, and updated sitemap.xml."
    )


if __name__ == "__main__":
    main()
