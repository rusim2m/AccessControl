namespace AccessControlPlatform.DTOs;

public class CreateAccessRuleRequest
{
    public int EmployeeId { get; set; }
    public int ZoneId { get; set; }
    public int ScheduleId { get; set; }
}

public class UpdateAccessRuleRequest
{
    public int EmployeeId { get; set; }
    public int ZoneId { get; set; }
    public int ScheduleId { get; set; }
}

public class AccessRuleResponse
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int ZoneId { get; set; }
    public string ZoneName { get; set; } = string.Empty;
    public int ScheduleId { get; set; }
    public string ScheduleName { get; set; } = string.Empty;
}
