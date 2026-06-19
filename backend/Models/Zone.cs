namespace AccessControlPlatform.Models;

public class Zone
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }

    public Organization? Organization { get; set; }
    public ICollection<Reader> Readers { get; set; } = new List<Reader>();
    public ICollection<AccessRule> AccessRules { get; set; } = new List<AccessRule>();
}
