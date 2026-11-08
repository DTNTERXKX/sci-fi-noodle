using System.Text.Json.Serialization;

namespace SciFiNoodles.Web.Katara;

public sealed class KataraTalkRequest
{
    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("mode")]
    public string? Mode { get; init; }
}

public sealed class KataraTalkResponse
{
    [JsonPropertyName("ok")]
    public bool Ok { get; init; }

    [JsonPropertyName("reply")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Reply { get; init; }

    [JsonPropertyName("voice")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Voice { get; init; }

    [JsonPropertyName("voiceNote")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? VoiceNote { get; init; }

    [JsonPropertyName("error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Error { get; init; }

    public static KataraTalkResponse Success(string reply, string? voice, string? voiceNote) =>
        new() { Ok = true, Reply = reply, Voice = voice, VoiceNote = voiceNote };

    public static KataraTalkResponse Failure(string error) => new() { Ok = false, Error = error };
}

public enum KataraMode
{
    Chill,
    Crunk,
    Glam,
}

internal sealed record AnswerRow(string Intent, string Keywords, int Weight, string Body);
