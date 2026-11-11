using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SciFiNoodles.Tests;

public sealed class HomepageTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly string _webRoot;
    private readonly string _shell;

    public HomepageTests(WebApplicationFactory<Program> factory)
    {
        var configured = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Development"));
        _webRoot = configured.Services.GetRequiredService<IWebHostEnvironment>().WebRootPath;
        _shell = File.ReadAllText(Path.Combine(_webRoot, "index.html"));
        _client = configured.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/Default.htm")]
    [InlineData("/default.aspx")]
    [InlineData("/index.html")]
    [InlineData("/INDEX.PHP")]
    [InlineData("/iisstart.htm")]
    public async Task Homepage_and_iis_default_documents_serve_the_spa_shell(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(_shell, await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("/contact")]
    [InlineData("/watch")]
    public async Task Menu_paths_serve_their_own_prerendered_page(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var page = File.ReadAllText(Path.Combine(_webRoot, path.TrimStart('/'), "index.html"));
        Assert.Equal(page, await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// The client entry calls hydrateRoot(document) and throws "Invariant failed" without the
    /// server's $_TSR payload; an empty #root shell shipped once and the live page went black.
    /// </summary>
    [Fact]
    public async Task Homepage_is_server_rendered_with_the_hydration_payload()
    {
        var html = await _client.GetStringAsync("/");

        Assert.Contains("$_TSR", html);
        Assert.Contains("/assets/", html);
        Assert.DoesNotContain("<div id=\"root\"></div>", html);
    }

    [Fact]
    public async Task Robots_and_missing_dotted_files_are_not_swallowed()
    {
        var robots = await _client.GetAsync("/robots.txt");
        Assert.Equal(HttpStatusCode.OK, robots.StatusCode);
        Assert.Equal("text/plain", robots.Content.Headers.ContentType?.MediaType);

        var missing = await _client.GetAsync("/assets/missing-file.js");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Theory]
    [InlineData("/index.cfm")]
    [InlineData("/index.jsp")]
    public async Task Remapped_default_document_names_serve_the_shell(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(_shell, await response.Content.ReadAsStringAsync());
        Assert.Equal(path, Assert.Single(response.Headers.GetValues("X-SFN-Path")));
    }

    /// <summary>
    /// The homepage's hydration data only matches <c>/</c>; served at another URL the page
    /// renders empty, so unknown page paths get the prerendered not-found page.
    /// </summary>
    [Theory]
    [InlineData("/some-old-page")]
    [InlineData("/originals/not-a-show")]
    [InlineData("/foo.php")]
    [InlineData("/watch/old-page.shtml")]
    public async Task Unknown_page_paths_serve_the_prerendered_not_found_page(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var notFound = File.ReadAllText(Path.Combine(_webRoot, "404.html"));
        Assert.Equal(notFound, await response.Content.ReadAsStringAsync());
        Assert.Equal(path, Assert.Single(response.Headers.GetValues("X-SFN-Path")));
    }

    [Theory]
    [InlineData("/assets/nope.js")]
    [InlineData("/missing.png")]
    [InlineData("/data/missing.json")]
    public async Task Missing_static_assets_stay_404_and_name_the_received_path(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(path, Assert.Single(response.Headers.GetValues("X-SFN-Path")));
    }

    [Fact]
    public async Task Head_on_a_remapped_homepage_is_200()
    {
        var response = await _client.SendAsync(new HttpRequestMessage(HttpMethod.Head, "/index.cfm"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("X-Original-URL", "/")]
    [InlineData("X-Original-URL", "/?utm_source=x")]
    [InlineData("X-Rewrite-URL", "/")]
    public async Task Original_url_header_for_root_serves_the_shell(string header, string value)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/assets/rewritten-by-iis.js");
        request.Headers.Add(header, value);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(_shell, await response.Content.ReadAsStringAsync());
        Assert.Equal("/assets/rewritten-by-iis.js", Assert.Single(response.Headers.GetValues("X-SFN-Path")));
    }

    [Theory]
    [InlineData("/app")]
    [InlineData("/app/")]
    public async Task App_redirects_to_root(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal("/", response.Headers.Location?.OriginalString);
    }
}
