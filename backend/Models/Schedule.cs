namespace AccessControlPlatform.Models;

public class Schedule
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }

    public string DaysOfWeek { get; set; } = string.Empty;

    public Organization? Organization { get; set; }
    public ICollection<AccessRule> AccessRules { get; set; } = new List<AccessRule>();
}
