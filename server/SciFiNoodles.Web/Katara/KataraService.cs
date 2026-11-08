using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;

namespace SciFiNoodles.Web.Katara;

public sealed class KataraService
{
    private static readonly Regex TiraPattern = new(
        @"t\s*\.\s*i\s*\.\s*r\s*\.\s*a\s*\.?",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    private static readonly Dictionary<KataraMode, string> VoiceFiles = new()
    {
        [KataraMode.Chill] = "katara_chill.mp3",
        [KataraMode.Crunk] = "katara_crunk.mp3",
        [KataraMode.Glam] = "katara_glam.mp3",
    };

    private static readonly Dictionary<KataraMode, string> ModeLabels = new()
    {
        [KataraMode.Chill] = "Chill",
        [KataraMode.Crunk] = "Crunk",
        [KataraMode.Glam] = "Glam",
    };

    private static readonly Dictionary<KataraMode, string> GreetingReplies = new()
    {
        [KataraMode.Chill] = "Hey bestie. Welcome to SCI-FI NOODLES. I'm Katara. Tell me a flavor or a title and I'll pour you a bowl.",
        [KataraMode.Crunk] = "YOOO! Welcome in. I'm Katara. Name a bowl and lock in.",
        [KataraMode.Glam] = "Darlings. Welcome to the counter. I'm Katara. Tell me the mood and I'll find your bowl.",
    };

    private static readonly Regex GreetingPattern = new(
        @"^(?:hi|hey|hello|yo|hiya|howdy|sup|greetings|welcome|hi there|hey there|hello there|hi katara|hey katara|hello katara|good morning|good afternoon|good evening|good night|good day|how are you|how are you doing|hows it going|whats up|what is up|whats good)$",
        RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    private readonly string _dbPath;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<KataraService> _logger;

    public KataraService(IConfiguration config, IWebHostEnvironment env, ILogger<KataraService> logger)
    {
        _env = env;
        _logger = logger;
        var configured = config["Katara:DatabasePath"] ?? "Data/katara.sqlite";
        _dbPath = ResolveDatabasePath(env, configured);
    }

    private static string ResolveDatabasePath(IWebHostEnvironment env, string configured)
    {
        if (Path.IsPathRooted(configured) && File.Exists(configured))
        {
            return configured;
        }

        var candidates = new[]
        {
            Path.Combine(env.ContentRootPath, configured),
            Path.Combine(AppContext.BaseDirectory, configured),
            Path.Combine(AppContext.BaseDirectory, "Data", "katara.sqlite"),
            Path.Combine(env.ContentRootPath, "Data", "katara.sqlite"),
        };

        foreach (var candidate in candidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return Path.Combine(env.ContentRootPath, configured);
    }

    public static string NormalizeQuestion(string input)
    {
        var text = input.ToLowerInvariant();
        text = TiraPattern.Replace(text, "tira");
        text = text.Replace('’', ' ').Replace('\'', ' ');
        text = Regex.Replace(text, @"[^a-z0-9]+", " ", RegexOptions.CultureInvariant);
        text = Regex.Replace(text, @"\s+", " ", RegexOptions.CultureInvariant).Trim();
        return text;
    }

    public static bool TryParseMode(string? raw, out KataraMode mode)
    {
        mode = KataraMode.Chill;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        return raw.Trim().ToLowerInvariant() switch
        {
            "chill" => Assign(KataraMode.Chill, out mode),
            "crunk" => Assign(KataraMode.Crunk, out mode),
            "glam" => Assign(KataraMode.Glam, out mode),
            _ => false,
        };

        static bool Assign(KataraMode value, out KataraMode target)
        {
            target = value;
            return true;
        }
    }

    public async Task<KataraTalkResponse> AnswerAsync(string message, KataraMode mode, CancellationToken cancellationToken)
    {
        try
        {
            var question = NormalizeQuestion(message);
            if (GreetingPattern.IsMatch(question))
            {
                var (greetingVoice, greetingNote) = VoiceFor(mode);
                return KataraTalkResponse.Success(GreetingReplies[mode], greetingVoice, greetingNote);
            }

            var rows = await LoadAnswersAsync(cancellationToken);
            AnswerRow? best = null;
            var bestScore = 0;

            foreach (var row in rows)
            {
                var score = ScoreRow(question, row);
                if (score > bestScore || (score == bestScore && score > 0 && best is not null && row.Weight > best.Weight))
                {
                    best = row;
                    bestScore = score;
                }
            }

            var fact = bestScore > 0 && best is not null
                ? best
                : rows.FirstOrDefault(row => row.Intent == "fallback");

            var body = fact?.Body
                ?? $"Point me at a flavor or a title, or open [Watch](/watch).";

            var template = rows.FirstOrDefault(row => row.Intent == "mode" && row.Keywords == ModeKey(mode))?.Body
                ?? "{body}";

            var reply = template.Replace("{body}", body, StringComparison.Ordinal);
            var (voice, voiceNote) = VoiceFor(mode);
            return KataraTalkResponse.Success(reply, voice, voiceNote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Katara menu lookup failed");
            return KataraTalkResponse.Failure("menu_unavailable");
        }
    }

    private static string ModeKey(KataraMode mode) => mode switch
    {
        KataraMode.Chill => "chill",
        KataraMode.Crunk => "crunk",
        KataraMode.Glam => "glam",
        _ => "chill",
    };

    private static int ScoreRow(string question, AnswerRow row)
    {
        if (string.IsNullOrEmpty(row.Keywords) || row.Intent == "mode" || row.Intent == "fallback")
        {
            return 0;
        }

        var best = 0;
        foreach (var phrase in row.Keywords.Split('|', StringSplitOptions.RemoveEmptyEntries))
        {
            if (phrase.Length >= 4 && question.Contains(phrase, StringComparison.Ordinal))
            {
                best = Math.Max(best, phrase.Length * row.Weight);
            }
        }

        return best;
    }

    private async Task<List<AnswerRow>> LoadAnswersAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_dbPath))
        {
            throw new FileNotFoundException("Katara database missing.", _dbPath);
        }

        await using var connection = new SqliteConnection($"Data Source={_dbPath};Mode=ReadOnly");
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT intent, keywords, weight, body FROM answers";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<AnswerRow>();
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new AnswerRow(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetInt32(2),
                reader.GetString(3)));
        }

        return rows;
    }

    private (string? Voice, string? VoiceNote) VoiceFor(KataraMode mode)
    {
        var file = VoiceFiles[mode];
        var candidates = new[]
        {
            Path.Combine(_env.WebRootPath, "voices", file),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "voices", file),
        };

        if (candidates.Any(File.Exists))
        {
            return ($"/voices/{file}", null);
        }

        return (null, $"No locked voice file for {ModeLabels[mode]} is on this machine.");
    }
}
