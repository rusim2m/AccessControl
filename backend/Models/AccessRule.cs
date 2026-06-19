namespace AccessControlPlatform.Models;

public class AccessRule
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int ZoneId { get; set; }
    public int ScheduleId { get; set; }

    public Employee? Employee { get; set; }
    public Zone? Zone { get; set; }
    public Schedule? Schedule { get; set; }
}
