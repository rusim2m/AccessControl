namespace AccessControlPlatform.Models;

public class AccessLog
{
    public int Id { get; set; }
    public string CardUID { get; set; } = string.Empty;
    public int? ReaderId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public AccessDecision Decision { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Reader? Reader { get; set; }
}
