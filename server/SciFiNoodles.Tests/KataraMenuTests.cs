using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SciFiNoodles.Tests;

public sealed class KataraMenuTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public KataraMenuTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Development")).CreateClient();
    }

    [Fact]
    public async Task Answers_from_sqlite_with_chill_voice()
    {
        var payload = await Ask("Where can I watch Neo-Osaka Rain?", "chill");
        Assert.True(payload.GetProperty("ok").GetBoolean());
        var reply = payload.GetProperty("reply").GetString()!;
        Assert.StartsWith("Hey bestie.", reply);
        Assert.Contains("[Neo-Osaka Rain](/atmospheres)", reply);
        Assert.Contains("https://www.youtube.com/watch?v=G-YEM6LOE8Y", reply);
        Assert.Equal("/voices/katara_chill.mp3", payload.GetProperty("voice").GetString());
    }

    [Fact]
    public async Task Frankenstein_uses_the_stored_video_url()
    {
        var payload = await Ask("When is Frankenstein: The Commit?", "chill");
        var reply = payload.GetProperty("reply").GetString()!;
        Assert.Contains("https://youtu.be/8bp4f2vml6A", reply);
        Assert.DoesNotContain("not live yet", reply, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("youtube.com/results", reply, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("search_query", reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Future_title_has_no_invented_youtube_url()
    {
        var payload = await Ask("When is The Ball Crashers?", "chill");
        var reply = payload.GetProperty("reply").GetString()!;
        Assert.Contains("Nov 13, 2026", reply);
        Assert.Contains("not live yet", reply, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("youtube.com", reply, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("youtu.be", reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Greeting_uses_the_mode_welcome()
    {
        var chill = await Ask("Hi!", "chill");
        var chillReply = chill.GetProperty("reply").GetString()!;
        Assert.StartsWith("Hey bestie.", chillReply);
        Assert.Contains("Welcome to SCI-FI NOODLES", chillReply);
        Assert.Equal("/voices/katara_chill.mp3", chill.GetProperty("voice").GetString());

        var glam = await Ask("good evening", "glam");
        Assert.StartsWith("Darlings.", glam.GetProperty("reply").GetString()!);
        Assert.Equal("/voices/katara_glam.mp3", glam.GetProperty("voice").GetString());
    }

    [Fact]
    public async Task Greeting_plus_a_title_still_answers_the_title()
    {
        var payload = await Ask("hey where can I watch Neo-Osaka Rain?", "chill");
        var reply = payload.GetProperty("reply").GetString()!;
        Assert.Contains("https://www.youtube.com/watch?v=G-YEM6LOE8Y", reply);
        Assert.DoesNotContain("Welcome to SCI-FI NOODLES", reply);
    }

    [Fact]
    public async Task Unknown_question_points_at_watch_board()
    {
        var payload = await Ask("How many moons does the shop cat have?", "crunk");
        var reply = payload.GetProperty("reply").GetString()!;
        Assert.StartsWith("YOOO!", reply);
        Assert.Contains("[Watch](/watch)", reply);
        Assert.DoesNotContain("youtube.com", reply, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("/voices/katara_crunk.mp3", payload.GetProperty("voice").GetString());
    }

    [Fact]
    public async Task Robots_and_sitemap_are_served()
    {
        var robots = await _client.GetStringAsync("/robots.txt");
        Assert.Contains("Disallow: /app", robots);
        Assert.Contains("Sitemap:", robots);

        var sitemap = await _client.GetStringAsync("/sitemap.xml");
        Assert.Contains("<urlset", sitemap);
        Assert.Contains("/watch", sitemap);
    }

    private async Task<JsonElement> Ask(string message, string mode)
    {
        var response = await _client.PostAsJsonAsync(
            "/api/katara/talk",
            new { message, mode, history = new[] { new { role = "user", content = "ignored" } } });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(
            "application/json",
            response.Content.Headers.ContentType?.MediaType ?? "",
            StringComparison.OrdinalIgnoreCase);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())!;
    }
}
