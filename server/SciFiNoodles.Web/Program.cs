using System.Text.Json;
using Microsoft.AspNetCore.HttpOverrides;
using SciFiNoodles.Web.Inbox;
using SciFiNoodles.Web.Katara;
using SciFiNoodles.Web.Middleware;
using SciFiNoodles.Web.Sitemap;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<KataraService>();
builder.Services.AddSingleton<InboxService>();
builder.Services.AddSingleton<SitemapService>();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
});

app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseMiddleware<SpaHtmlMiddleware>();

app.MapGet("/app", () => Results.Redirect("/", permanent: true));
app.MapGet("/app/", () => Results.Redirect("/", permanent: true));

app.MapGet("/robots.txt", (SitemapService sitemap) =>
    Results.Text(sitemap.BuildRobotsTxt(), "text/plain; charset=utf-8"));

app.MapGet("/sitemap.xml", (SitemapService sitemap) =>
    Results.Content(sitemap.BuildSitemapXml(), "application/xml; charset=utf-8"));

app.MapPost("/api/katara/talk", async (HttpRequest request, KataraService katara, CancellationToken cancellationToken) =>
{
    if (request.ContentLength is > 20_000)
    {
        return Results.Json(KataraTalkResponse.Failure("bad_request"), statusCode: StatusCodes.Status413PayloadTooLarge);
    }

    KataraTalkRequest? payload;
    try
    {
        payload = await request.ReadFromJsonAsync<KataraTalkRequest>(cancellationToken);
    }
    catch (JsonException)
    {
        return Results.Json(KataraTalkResponse.Failure("bad_request"), statusCode: StatusCodes.Status400BadRequest);
    }

    if (payload?.Message is not { Length: > 0 and <= 500 } message ||
        !KataraService.TryParseMode(payload.Mode, out var mode))
    {
        return Results.Json(KataraTalkResponse.Failure("bad_request"), statusCode: StatusCodes.Status400BadRequest);
    }

    var answer = await katara.AnswerAsync(message, mode, cancellationToken);
    var status = answer.Ok ? StatusCodes.Status200OK : StatusCodes.Status500InternalServerError;
    return Results.Json(answer, statusCode: status);
});

app.MapPost("/api/inbox", async (HttpRequest request, InboxService inbox, CancellationToken cancellationToken) =>
{
    if (request.ContentLength is > 20_000)
    {
        return Results.Json(InboxResponse.Failure("bad_request"), statusCode: StatusCodes.Status413PayloadTooLarge);
    }

    InboxRequest? payload;
    try
    {
        payload = await request.ReadFromJsonAsync<InboxRequest>(cancellationToken);
    }
    catch (JsonException)
    {
        return Results.Json(InboxResponse.Failure("bad_request"), statusCode: StatusCodes.Status400BadRequest);
    }

    var submission = InboxService.Normalize(payload);
    if (submission is null)
    {
        return Results.Json(InboxResponse.Failure("bad_request"), statusCode: StatusCodes.Status400BadRequest);
    }

    try
    {
        await inbox.SaveAsync(submission, cancellationToken);
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
        throw;
    }
    catch (Exception)
    {
        return Results.Json(InboxResponse.Failure("unavailable"), statusCode: StatusCodes.Status500InternalServerError);
    }

    return Results.Json(InboxResponse.Received());
});

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
