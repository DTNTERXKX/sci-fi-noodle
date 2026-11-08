namespace SciFiNoodles.Web.Middleware;

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private const string ContentSecurityPolicy =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "media-src 'self' blob: https:; " +
        "connect-src 'self' https:; " +
        "frame-src 'self'; " +
        "base-uri 'self'; form-action 'self'";

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers["Content-Security-Policy"] = ContentSecurityPolicy;
            headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
            headers["X-Content-Type-Options"] = "nosniff";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()";
            headers["X-XSS-Protection"] = "0";
            return Task.CompletedTask;
        });

        await next(context);
    }
}
