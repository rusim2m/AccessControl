namespace AccessControlPlatform.DTOs;

public class CreateZoneRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateZoneRequest
{
    public string Name { get; set; } = string.Empty;
}

public class ZoneResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrganizationId { get; set; }
    public int ReaderCount { get; set; }
}
