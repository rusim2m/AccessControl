namespace AccessControlPlatform.DTOs;

public class AssignDeviceToDealerRequest
{
    public int DealerId { get; set; }
}

public class AssignReaderToOrganizationRequest
{
    public int OrganizationId { get; set; }
    public string? Name { get; set; }
}

public class AssignReaderToZoneRequest
{
    public int? ZoneId { get; set; }
}

public class ReaderResponse
{
    public int Id { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public int? ZoneId { get; set; }
    public string? ZoneName { get; set; }
    public DateTime? AssignedToOrganizationAt { get; set; }
}

public class InventoryDeviceResponse
{
    public int Id { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public int? DealerId { get; set; }
    public string? DealerName { get; set; }
    public int? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public DateTime? AssignedToDealerAt { get; set; }
    public DateTime? AssignedToOrganizationAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
