using System.Text.Json;

namespace SciFiNoodles.Web.Sitemap;

public sealed class SitemapService
{
    private readonly string _publicUrl;
    private readonly IWebHostEnvironment _env;

    public SitemapService(IConfiguration config, IWebHostEnvironment env)
    {
        _env = env;
        _publicUrl = (config["Site:PublicUrl"] ?? "https://www.scifinoodles.com").TrimEnd('/');
    }

    public string BuildSitemapXml()
    {
        var paths = LoadPaths();
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var lines = new List<string>
        {
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
        };

        foreach (var path in paths.Distinct(StringComparer.Ordinal))
        {
            lines.Add($"  <url><loc>{_publicUrl}{path}</loc><lastmod>{today}</lastmod></url>");
        }

        lines.Add("</urlset>");
        return string.Join('\n', lines);
    }

    public string BuildRobotsTxt()
    {
        return string.Join('\n', new[]
        {
            "User-agent: *",
            "Disallow: /app",
            "Allow: /",
            "",
            $"Sitemap: {_publicUrl}/sitemap.xml",
        });
    }

    private IReadOnlyList<string> LoadPaths()
    {
        var jsonPath = Path.Combine(_env.ContentRootPath, "Data", "sitemap-paths.json");
        if (!File.Exists(jsonPath))
        {
            return DefaultPaths();
        }

        var json = File.ReadAllText(jsonPath);
        var paths = JsonSerializer.Deserialize<string[]>(json);
        return paths is { Length: > 0 } ? paths : DefaultPaths();
    }

    private static IReadOnlyList<string> DefaultPaths() =>
        new[]
        {
            "/",
            "/watch",
            "/originals",
            "/public-domain",
            "/docs",
            "/atmospheres",
            "/shorts",
            "/lab",
            "/host",
            "/about",
            "/contact",
            "/privacy",
            "/terms",
            "/rights",
        };
}
