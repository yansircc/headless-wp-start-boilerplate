/**
 * Sitemap XSL Stylesheet Route
 *
 * Provides a beautiful XSL stylesheet for rendering sitemaps in browsers.
 * GET /sitemap.xsl
 */

import { createFileRoute } from "@tanstack/react-router";

const XSL_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

<xsl:output method="html" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
<html lang="en">
<head>
  <title>
    <xsl:choose>
      <xsl:when test="sitemap:sitemapindex">Sitemap Index</xsl:when>
      <xsl:otherwise>Sitemap</xsl:otherwise>
    </xsl:choose>
  </title>
  <style>
    :root {
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      --glass-bg: rgba(255, 255, 255, 0.03);
      --glass-border: rgba(255, 255, 255, 0.1);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      line-height: 1.5;
    }

    .container {
      width: 100%;
      max-width: 1000px;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 0.75rem;
      background: linear-gradient(to right, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .stats {
      display: inline-flex;
      gap: 2rem;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 9999px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-value {
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card {
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--glass-border);
    }

    td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--glass-border);
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    tr:last-child td { border-bottom: none; }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      word-break: break-all;
      transition: color 0.2s;
    }

    a:hover {
      color: var(--primary-hover);
      text-decoration: underline;
    }

    .priority-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .priority-high { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
    .priority-medium { background: rgba(234, 179, 8, 0.1); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.2); }
    .priority-low { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

    .date-text {
      color: var(--text-muted);
      font-family: monospace;
      font-size: 0.875rem;
    }

    footer {
      margin-top: 4rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    footer a { color: var(--text-muted); text-decoration: underline; }

    @media (max-width: 768px) {
      body { padding: 2rem 1rem; }
      h1 { font-size: 1.75rem; }
      .stats { flex-direction: column; gap: 0.5rem; border-radius: 16px; }
      th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3) { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">Sitemap Index</xsl:when>
          <xsl:otherwise>XML Sitemap</xsl:otherwise>
        </xsl:choose>
      </h1>
      <p class="subtitle">
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">
            Central directory for all sub-sitemaps on this project.
          </xsl:when>
          <xsl:otherwise>
            Optimized index containing <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> discovered URLs.
          </xsl:otherwise>
        </xsl:choose>
      </p>
      <div class="stats">
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></span>
              <span class="stat-label">Total Sitemaps</span>
            </div>
          </xsl:when>
          <xsl:otherwise>
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
              <span class="stat-label">Total URLs</span>
            </div>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </header>

    <div class="card">
      <xsl:choose>
        <xsl:when test="sitemap:sitemapindex">
          <table>
            <thead>
              <tr>
                <th>Sitemap URL</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                <tr>
                  <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                  <td class="date-text">
                    <xsl:if test="sitemap:lastmod">
                      <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                    </xsl:if>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:when>
        <xsl:otherwise>
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                  <td>
                    <xsl:if test="sitemap:priority">
                      <xsl:variable name="priority" select="sitemap:priority"/>
                      <span>
                        <xsl:attribute name="class">
                          <xsl:text>priority-badge </xsl:text>
                          <xsl:choose>
                            <xsl:when test="$priority &gt;= 0.7">priority-high</xsl:when>
                            <xsl:when test="$priority &gt;= 0.4">priority-medium</xsl:when>
                            <xsl:otherwise>priority-low</xsl:otherwise>
                          </xsl:choose>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </xsl:if>
                  </td>
                  <td style="text-transform: capitalize; color: var(--text-muted);"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td class="date-text">
                    <xsl:if test="sitemap:lastmod">
                      <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                    </xsl:if>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:otherwise>
      </xsl:choose>
    </div>

    <footer>
      Generated by <a href="https://yoast.com/wordpress/plugins/seo/">Yoast SEO</a> ·
      Powered by Headless WordPress Boilerplate
    </footer>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>`;

export const Route = createFileRoute("/sitemap.xsl")({
	server: {
		handlers: {
			GET: () =>
				new Response(XSL_CONTENT, {
					status: 200,
					headers: {
						"Content-Type": "application/xslt+xml",
						"Cache-Control": "public, max-age=86400, s-maxage=86400",
					},
				}),
		},
	},
});
