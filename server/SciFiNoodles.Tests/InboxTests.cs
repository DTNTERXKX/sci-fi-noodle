using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SciFiNoodles.Tests;

public sealed class InboxTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public InboxTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Development")).CreateClient();
    }

    [Fact]
    public async Task Join_is_received_and_a_bad_address_is_refused()
    {
        var saved = await _client.PostAsJsonAsync("/api/inbox", new { kind = "join", email = " Guest@Example.com " });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var payload = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(payload.GetProperty("ok").GetBoolean());

        var refused = await _client.PostAsJsonAsync("/api/inbox", new { kind = "join", email = "not-an-email" });
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        var error = await refused.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(error.GetProperty("ok").GetBoolean());
    }

    [Fact]
    public async Task Contact_keeps_name_email_and_note()
    {
        var saved = await _client.PostAsJsonAsync(
            "/api/inbox",
            new
            {
                kind = "contact",
                name = "Noodle Guest",
                email = "guest@example.com",
                note = "We want a partnership conversation about the shop.",
            });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        var shortNote = await _client.PostAsJsonAsync(
            "/api/inbox",
            new { kind = "contact", name = "Noodle Guest", email = "guest@example.com", note = "too short" });
        Assert.Equal(HttpStatusCode.BadRequest, shortNote.StatusCode);
    }
}
