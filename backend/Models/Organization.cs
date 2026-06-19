namespace AccessControlPlatform.Models;

public class Organization
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DealerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Dealer { get; set; }

    public ICollection<User> Employees { get; set; } = new List<User>();

    public ICollection<Zone> Zones { get; set; } = new List<Zone>();
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();

    public ICollection<Employee> Staff { get; set; } = new List<Employee>();
}
