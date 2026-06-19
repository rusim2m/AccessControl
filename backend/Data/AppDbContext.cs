using AccessControlPlatform.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace AccessControlPlatform.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Zone> Zones => Set<Zone>();
    public DbSet<Reader> Readers => Set<Reader>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<AccessRule> AccessRules => Set<AccessRule>();
    public DbSet<AccessLog> AccessLogs => Set<AccessLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Name).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).IsRequired().HasConversion<string>().HasMaxLength(20);

            entity.HasOne(u => u.Dealer)
                  .WithMany()
                  .HasForeignKey(u => u.DealerId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);

            entity.HasOne(u => u.Organization)
                  .WithMany(o => o.Employees)
                  .HasForeignKey(u => u.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).IsRequired().HasMaxLength(200);

            entity.HasOne(o => o.Dealer)
                  .WithMany()
                  .HasForeignKey(o => o.DealerId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(true);
        });

        modelBuilder.Entity<Zone>(entity =>
        {
            entity.HasKey(z => z.Id);
            entity.Property(z => z.Name).IsRequired().HasMaxLength(200);

            entity.HasOne(z => z.Organization)
                  .WithMany(o => o.Zones)
                  .HasForeignKey(z => z.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reader>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.SerialNumber).IsRequired().HasMaxLength(50);
            entity.HasIndex(r => r.SerialNumber).IsUnique();
            entity.Property(r => r.ApiKey).IsRequired().HasMaxLength(64);
            entity.Property(r => r.Name).HasMaxLength(200);

            entity.HasOne(r => r.Dealer)
                  .WithMany()
                  .HasForeignKey(r => r.DealerId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);

            entity.HasOne(r => r.Organization)
                  .WithMany()
                  .HasForeignKey(r => r.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);

            entity.HasOne(r => r.Zone)
                  .WithMany(z => z.Readers)
                  .HasForeignKey(r => r.ZoneId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        modelBuilder.Entity<Card>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.UID).IsRequired().HasMaxLength(64);
            entity.HasIndex(c => c.UID).IsUnique();

            entity.HasOne(c => c.Organization)
                  .WithMany(o => o.Cards)
                  .HasForeignKey(c => c.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.AssignedToEmployee)
                  .WithOne(e => e.Card)
                  .HasForeignKey<Card>(c => c.AssignedToEmployeeId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

            entity.HasOne(e => e.Organization)
                  .WithMany(o => o.Staff)
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).IsRequired().HasMaxLength(200);
            entity.Property(s => s.DaysOfWeek).IsRequired().HasMaxLength(100);

            entity.HasOne(s => s.Organization)
                  .WithMany(o => o.Schedules)
                  .HasForeignKey(s => s.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccessRule>(entity =>
        {
            entity.HasKey(ar => ar.Id);

            entity.HasIndex(ar => new { ar.EmployeeId, ar.ZoneId, ar.ScheduleId }).IsUnique();

            entity.HasOne(ar => ar.Employee)
                  .WithMany(e => e.AccessRules)
                  .HasForeignKey(ar => ar.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ar => ar.Zone)
                  .WithMany(z => z.AccessRules)
                  .HasForeignKey(ar => ar.ZoneId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(ar => ar.Schedule)
                  .WithMany(s => s.AccessRules)
                  .HasForeignKey(ar => ar.ScheduleId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<AccessLog>(entity =>
        {
            entity.HasKey(al => al.Id);
            entity.Property(al => al.CardUID).IsRequired().HasMaxLength(64);
            entity.Property(al => al.Reason).HasMaxLength(500);
            entity.Property(al => al.Decision).HasConversion<string>().HasMaxLength(10);

            entity.HasOne(al => al.Reader)
                  .WithMany(r => r.AccessLogs)
                  .HasForeignKey(al => al.ReaderId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v.HasValue ? v.Value.ToUniversalTime() : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(utcConverter);
                else if (property.ClrType == typeof(DateTime?))
                    property.SetValueConverter(nullableUtcConverter);
            }
        }
    }
}
