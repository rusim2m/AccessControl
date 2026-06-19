namespace AccessControlPlatform.DTOs;

public class CreateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
}

public class EmployeeResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public int? CardId { get; set; }
    public string? CardUID { get; set; }
    public DateTime CreatedAt { get; set; }
}
