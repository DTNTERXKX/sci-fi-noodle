using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;

namespace SciFiNoodles.Web.Inbox;

public sealed class InboxService
{
    private static readonly Regex EmailPattern = new(
        @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(100));

    private const string Schema = """
        CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY,
          kind TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          note TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        """;

    private readonly string _dbPath;
    private readonly ILogger<InboxService> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public InboxService(IConfiguration config, IWebHostEnvironment env, ILogger<InboxService> logger)
    {
        _logger = logger;
        var configured = config["Inbox:DatabasePath"] ?? "Data/inbox.sqlite";
        _dbPath = Path.IsPathRooted(configured)
            ? configured
            : Path.Combine(env.ContentRootPath, configured);
    }

    public static InboxSubmission? Normalize(InboxRequest? request)
    {
        if (request?.Kind is not ("join" or "contact"))
        {
            return null;
        }

        var email = request.Email?.Trim() ?? "";
        if (request.Kind == "join")
        {
            email = email.ToLowerInvariant();
        }

        if (email.Length is 0 or > 254 || !EmailPattern.IsMatch(email))
        {
            return null;
        }

        if (request.Kind == "join")
        {
            return new InboxSubmission("join", "", email, "");
        }

        var name = request.Name?.Trim() ?? "";
        var note = request.Note?.Trim() ?? "";
        if (name.Length is < 2 or > 200 || note.Length is < 12 or > 4000)
        {
            return null;
        }

        return new InboxSubmission("contact", name, email, note);
    }

    public async Task SaveAsync(InboxSubmission submission, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var directory = Path.GetDirectoryName(_dbPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await using var connection = new SqliteConnection($"Data Source={_dbPath}");
            await connection.OpenAsync(cancellationToken);
            await using (var create = connection.CreateCommand())
            {
                create.CommandText = Schema;
                await create.ExecuteNonQueryAsync(cancellationToken);
            }

            await using var insert = connection.CreateCommand();
            insert.CommandText = """
                INSERT INTO submissions (kind, name, email, note, created_at)
                VALUES ($kind, $name, $email, $note, $created)
                """;
            insert.Parameters.AddWithValue("$kind", submission.Kind);
            insert.Parameters.AddWithValue("$name", submission.Name);
            insert.Parameters.AddWithValue("$email", submission.Email);
            insert.Parameters.AddWithValue("$note", submission.Note);
            insert.Parameters.AddWithValue("$created", DateTime.UtcNow.ToString("O"));
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Inbox save failed");
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }
}

public sealed record InboxSubmission(string Kind, string Name, string Email, string Note);

public sealed class InboxRequest
{
    [JsonPropertyName("kind")]
    public string? Kind { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("note")]
    public string? Note { get; init; }
}

public sealed class InboxResponse
{
    [JsonPropertyName("ok")]
    public bool Ok { get; init; }

    [JsonPropertyName("error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Error { get; init; }

    public static InboxResponse Received() => new() { Ok = true };

    public static InboxResponse Failure(string error) => new() { Ok = false, Error = error };
}
