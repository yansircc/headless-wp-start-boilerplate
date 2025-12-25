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
<html>
<head>
  <title>
    <xsl:choose>
      <xsl:when test="sitemap:sitemapindex">Sitemap Index</xsl:when>
      <xsl:otherwise>Sitemap</xsl:otherwise>
    </xsl:choose>
  </title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a202c;
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #718096;
      font-size: 0.95rem;
    }
    .stats {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }
    .stat-label {
      color: #718096;
      font-size: 0.85rem;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-collapse: collapse;
    }
    th {
      background: #f7fafc;
      color: #4a5568;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      color: #2d3748;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: #f7fafc;
    }
    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      word-break: break-all;
    }
    a:hover {
      text-decoration: underline;
    }
    .priority {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .priority-high { background: #c6f6d5; color: #22543d; }
    .priority-medium { background: #fefcbf; color: #744210; }
    .priority-low { background: #fed7d7; color: #742a2a; }
    .date {
      color: #718096;
      font-size: 0.875rem;
    }
    footer {
      text-align: center;
      margin-top: 2rem;
      color: rgba(255,255,255,0.8);
      font-size: 0.85rem;
    }
    footer a {
      color: white;
    }
    @media (max-width: 768px) {
      body { padding: 1rem; }
      header { padding: 1.5rem; }
      .stats { flex-direction: column; gap: 1rem; }
      th, td { padding: 0.75rem 0.5rem; font-size: 0.85rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">📋 Sitemap Index</xsl:when>
          <xsl:otherwise>🗺️ XML Sitemap</xsl:otherwise>
        </xsl:choose>
      </h1>
      <p class="subtitle">
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">
            This sitemap index contains links to all sub-sitemaps for this website.
          </xsl:when>
          <xsl:otherwise>
            This sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs.
          </xsl:otherwise>
        </xsl:choose>
      </p>
      <div class="stats">
        <xsl:choose>
          <xsl:when test="sitemap:sitemapindex">
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></span>
              <span class="stat-label">Sitemaps</span>
            </div>
          </xsl:when>
          <xsl:otherwise>
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
              <span class="stat-label">URLs</span>
            </div>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </header>

    <xsl:choose>
      <xsl:when test="sitemap:sitemapindex">
        <table>
          <thead>
            <tr>
              <th>Sitemap</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
              <tr>
                <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                <td class="date">
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
              <th>URL</th>
              <th>Priority</th>
              <th>Change Freq</th>
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
                        <xsl:text>priority </xsl:text>
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
                <td><xsl:value-of select="sitemap:changefreq"/></td>
                <td class="date">
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

    <footer>
      Generated by <a href="https://yoast.com/wordpress/plugins/seo/">Yoast SEO</a> ·
      Styled by Headless WordPress
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
