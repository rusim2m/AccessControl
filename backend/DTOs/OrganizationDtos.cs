namespace AccessControlPlatform.DTOs;

public class CreateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
}

public class OrganizationResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DealerId { get; set; }
    public string DealerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CardCount { get; set; }
    public int ReaderCount { get; set; }
}
