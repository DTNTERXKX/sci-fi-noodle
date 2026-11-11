namespace SciFiNoodles.Web.Middleware;

/// <summary>
/// Serves the prerendered <c>wwwroot/&lt;path&gt;/index.html</c> for extensionless GET requests.
/// <c>/</c> and every IIS default-document name get <c>wwwroot/index.html</c>, so the homepage
/// survives whatever IIS rewrites <c>/</c> to. Any other GET/HEAD that would 404 gets the
/// prerendered <c>404.html</c>, unless it is a reserved route or a static asset.
/// </summary>
public sealed class SpaHtmlMiddleware(RequestDelegate next, IWebHostEnvironment env, ILogger<SpaHtmlMiddleware> logger)
{
    public const string PathHeader = "X-SFN-Path";
    public const string NotFoundPage = "404.html";

    public async Task InvokeAsync(HttpContext context)
    {
        var received = ReceivedPath(context.Request);
        context.Response.OnStarting(() =>
        {
            if (context.Response.StatusCode == StatusCodes.Status404NotFound)
            {
                context.Response.Headers[PathHeader] = received;
                logger.LogInformation("404 for path {ReceivedPath}", received);
            }

            return Task.CompletedTask;
        });

        var method = context.Request.Method;
        if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method))
        {
            await next(context);
            return;
        }

        if (IsReserved(context.Request.Path.Value ?? ""))
        {
            await next(context);
            return;
        }

        if (OriginalPath(context.Request) is { } original)
        {
            if (original == "/")
            {
                await SendShellAsync(context, received);
                return;
            }

            if (!IsReserved(original))
            {
                context.Request.Path = original;
            }
        }

        var path = context.Request.Path.Value ?? "";
        var trimmed = path.TrimEnd('/');
        var lastSlash = trimmed.LastIndexOf('/');
        var lastSegment = lastSlash >= 0 ? trimmed[(lastSlash + 1)..] : trimmed;
        if (string.IsNullOrEmpty(trimmed) || IisDefaultDocuments.Contains(lastSegment))
        {
            if (await SendShellAsync(context, received))
            {
                return;
            }

            await next(context);
            return;
        }

        if (!lastSegment.Contains('.'))
        {
            var relative = trimmed.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var indexPath = Path.Combine(env.WebRootPath ?? "", relative, "index.html");
            if (File.Exists(indexPath))
            {
                await SendHtmlAsync(context, indexPath);
                return;
            }
        }

        await next(context);

        if (context.Response.StatusCode == StatusCodes.Status404NotFound &&
            !context.Response.HasStarted &&
            !IsStaticAsset(path))
        {
            if (!await SendNotFoundPageAsync(context))
            {
                await SendShellAsync(context, received);
            }
        }
    }

    /// <summary>
    /// The prerendered pages hydrate only at the URL they were rendered for, so an unknown
    /// page path gets the prerendered not-found page rather than the homepage.
    /// </summary>
    private async Task<bool> SendNotFoundPageAsync(HttpContext context)
    {
        var page = Path.Combine(env.WebRootPath ?? "", NotFoundPage);
        if (!File.Exists(page))
        {
            return false;
        }

        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await SendHtmlAsync(context, page);
        return true;
    }

    private async Task<bool> SendShellAsync(HttpContext context, string received)
    {
        var shell = Path.Combine(env.WebRootPath ?? "", "index.html");
        if (!File.Exists(shell))
        {
            return false;
        }

        if (received != "/")
        {
            context.Response.Headers[PathHeader] = received;
            logger.LogInformation("Served SPA shell for remapped path {ReceivedPath}", received);
        }

        context.Response.StatusCode = StatusCodes.Status200OK;
        await SendHtmlAsync(context, shell);
        return true;
    }

    private static async Task SendHtmlAsync(HttpContext context, string file)
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        if (HttpMethods.IsHead(context.Request.Method))
        {
            context.Response.ContentLength = new FileInfo(file).Length;
            return;
        }

        await context.Response.SendFileAsync(file);
    }

    /// <summary>Path only, URI-escaped so it is always a safe ASCII header value.</summary>
    private static string ReceivedPath(HttpRequest request)
    {
        var value = request.PathBase.Add(request.Path).ToUriComponent();
        if (value.Length == 0)
        {
            value = "/";
        }

        return value.Length > 512 ? value[..512] : value;
    }

    /// <summary>
    /// IIS URL Rewrite keeps the client's URL in <c>X-Original-URL</c> (ISAPI rewriters use
    /// <c>X-Rewrite-URL</c>) and forwards the rewritten one as the request path.
    /// </summary>
    private static string? OriginalPath(HttpRequest request)
    {
        var raw = request.Headers["X-Original-URL"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(raw))
        {
            raw = request.Headers["X-Rewrite-URL"].FirstOrDefault();
        }

        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var end = raw.IndexOfAny(['?', '#']);
        var pathPart = (end >= 0 ? raw[..end] : raw).Trim();
        if (!pathPart.StartsWith('/') || pathPart.StartsWith("//"))
        {
            return null;
        }

        return PathString.FromUriComponent(pathPart).Value;
    }

    private static bool IsReserved(string path) =>
        HasPrefix(path, "/api") ||
        HasPrefix(path, "/app") ||
        HasPrefix(path, "/.well-known") ||
        path.Equals("/robots.txt", StringComparison.OrdinalIgnoreCase) ||
        path.Equals("/sitemap.xml", StringComparison.OrdinalIgnoreCase);

    private static bool HasPrefix(string path, string prefix) =>
        path.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase);

    private static bool IsStaticAsset(string path)
    {
        if (path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var extension = Path.GetExtension(path.TrimEnd('/'));
        return extension.Length > 1 && StaticExtensions.Contains(extension[1..]);
    }

    /// <summary>
    /// A miss on one of these stays 404: a stale asset hash answered with HTML breaks the page
    /// in confusing ways. Page-like names (.htm, .php, .cfm, …) get the shell.
    /// </summary>
    private static readonly HashSet<string> StaticExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        "js", "mjs", "css", "map", "json", "webmanifest",
        "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico",
        "woff", "woff2", "ttf", "otf",
        "mp3", "mp4", "webm", "wav", "ogg",
        "txt", "xml", "pdf", "zip", "sqlite",
    };

    /// <summary>
    /// With IIS default documents on, IIS can rewrite <c>/</c> to one of these names before
    /// forwarding to Kestrel, which list entry depends on the Plesk setup. Serve the SPA shell
    /// for all of them.
    /// </summary>
    private static readonly HashSet<string> IisDefaultDocuments = new(StringComparer.OrdinalIgnoreCase)
    {
        "Default.htm",
        "Default.html",
        "Default.asp",
        "Default.aspx",
        "default.php",
        "index.htm",
        "index.html",
        "index.php",
        "index.asp",
        "index.aspx",
        "index.cfm",
        "index.shtml",
        "index.jsp",
        "iisstart.htm",
    };
}
