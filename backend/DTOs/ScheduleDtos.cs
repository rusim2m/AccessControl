namespace AccessControlPlatform.DTOs;

public class CreateScheduleRequest
{
    public string Name { get; set; } = string.Empty;
    public string TimeFrom { get; set; } = string.Empty;
    public string TimeTo { get; set; } = string.Empty;
    public string DaysOfWeek { get; set; } = string.Empty;
}

public class UpdateScheduleRequest
{
    public string Name { get; set; } = string.Empty;
    public string TimeFrom { get; set; } = string.Empty;
    public string TimeTo { get; set; } = string.Empty;
    public string DaysOfWeek { get; set; } = string.Empty;
}

public class ScheduleResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public string TimeFrom { get; set; } = string.Empty;
    public string TimeTo { get; set; } = string.Empty;
    public string DaysOfWeek { get; set; } = string.Empty;
}
