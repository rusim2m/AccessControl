namespace AccessControlPlatform.Models;

public class Reader
{
    public int Id { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int? DealerId { get; set; }
    public int? OrganizationId { get; set; }
    public int? ZoneId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AssignedToDealerAt { get; set; }
    public DateTime? AssignedToOrganizationAt { get; set; }

    public User? Dealer { get; set; }
    public Organization? Organization { get; set; }
    public Zone? Zone { get; set; }
    public ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
}
