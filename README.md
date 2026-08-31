# universemaker.github.io

Source for **Daeseung Park's** personal site, published via GitHub Pages at **[universemaker.github.io](https://universemaker.github.io)**.

The site is a bilingual (Korean / English) portfolio and technical-writing site covering research and side projects — AI/ML, LLMs, geospatial/navigation systems, IoT, and more — plus an activity log and article archive.

## Structure

```
.
├── index.html, activity.html, articles.html   # Korean (root) site
├── en/                                          # English mirror of the site
│   ├── works/                                   # Published research/work items
│   └── notices/                                 # Site notices
├── articles/                                    # Long-form technical articles
├── assets/
│   ├── style.css, article.css                   # Site styles
│   ├── main.js, data.js, i18n-en.js             # Site scripts / i18n content
│   └── portfolio/                               # Per-project images/SVGs
└── CNAME                                        # Custom domain configuration
```

## Local preview

This is a static site — serve the repository root with any static file server, e.g.:

```bash
python -m http.server 8000
```

then open `http://localhost:8000`.

## Deployment

Pushes to the default branch are published automatically by GitHub Pages to the domain configured in [`CNAME`](CNAME).

## Author

**Daeseung Park** ([@UniverseMaker](https://github.com/UniverseMaker)) — dspark@kaist.ac.kr
