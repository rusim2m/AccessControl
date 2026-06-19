namespace AccessControlPlatform.DTOs;

public class AccessLogResponse
{
    public int Id { get; set; }
    public string CardUID { get; set; } = string.Empty;
    public string? EmployeeName { get; set; }
    public int? ReaderId { get; set; }
    public string? ReaderName { get; set; }
    public string? ZoneName { get; set; }
    public DateTime Timestamp { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
