namespace AccessControlPlatform.Models;

public class Card
{
    public int Id { get; set; }
    public string UID { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public int? AssignedToEmployeeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public Employee? AssignedToEmployee { get; set; }
}
