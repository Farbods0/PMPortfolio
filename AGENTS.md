# Workspace Rules: PMPortfolio

## Human-Written Copy (No AI Slop)
- **Never use em dashes (`—`, `&mdash;`) or en dashes (`–`, `&ndash;`)** anywhere in page copy, titles, metadata, comments, recipe data, or UI strings.
- Rewrite sentences naturally using commas, periods, colons, parentheses, or simple phrasing instead of em-dash clauses.
- Use plain ASCII hyphens (`-`) or words (`to`) for date ranges and numeric ranges (e.g., `2010 - 2026`, `Feb 2026 - Present`, `1 to 3 hours`).
- Avoid generic AI-slop filler phrases and overly dramatic buzzwords. Keep copy direct, clear, and authentic to Farbod Jahan's voice.

## Layout & Navigation
- Always scope fixed site navbar styles to `.external-wrapper > header` rather than bare `header`, so semantic `<header>` elements inside `<main>` cannot overlap or hijack the site navigation.
- Every page must keep a clear, working path back to Home (`/`) on both desktop and mobile.
