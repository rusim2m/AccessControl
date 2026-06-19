namespace AccessControlPlatform.DTOs;

public class CreateCardRequest
{
    public string UID { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
}

public class ProvisionCardRequest
{
    public int OrganizationId { get; set; }
}

public class AssignCardRequest
{
    public int? EmployeeId { get; set; }
}

public class CardResponse
{
    public int Id { get; set; }
    public string UID { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public int? AssignedToEmployeeId { get; set; }
    public string? AssignedToEmployeeName { get; set; }
    public DateTime CreatedAt { get; set; }
}
