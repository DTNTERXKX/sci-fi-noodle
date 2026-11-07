namespace SciFiNoodles.Web.Middleware;

/// <summary>
/// Serves <c>wwwroot/&lt;path&gt;/index.html</c> for extensionless GET requests so crawlers
/// and first paint see HTML; the client router still hydrates from the same shell.
/// </summary>
public sealed class SpaHtmlMiddleware(RequestDelegate next, IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method))
        {
            await next(context);
            return;
        }

        var path = context.Request.Path.Value ?? "";
        if (IsReserved(path))
        {
            await next(context);
            return;
        }

        var trimmed = path.TrimEnd('/');
        if (string.IsNullOrEmpty(trimmed))
        {
            await next(context);
            return;
        }

        var lastSlash = trimmed.LastIndexOf('/');
        var lastSegment = lastSlash >= 0 ? trimmed[(lastSlash + 1)..] : trimmed;
        if (lastSegment.Contains('.') && !lastSegment.Equals("index.html", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var relative = trimmed.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var indexPath = Path.Combine(env.WebRootPath ?? "", relative, "index.html");
        if (File.Exists(indexPath))
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.SendFileAsync(indexPath);
            return;
        }

        await next(context);
    }

    private static bool IsReserved(string path)
    {
        if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (path.Equals("/robots.txt", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/sitemap.xml", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return path.StartsWith("/app", StringComparison.OrdinalIgnoreCase);
    }
}
