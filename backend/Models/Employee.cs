namespace AccessControlPlatform.Models;

public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public Card? Card { get; set; }
    public ICollection<AccessRule> AccessRules { get; set; } = new List<AccessRule>();
}
