using AccessControlPlatform.Models;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Migration/EnsureCreated failed: {Message}", ex.Message);
        }

        User adminUser;
        if (!await context.Users.AnyAsync(u => u.Email == "admin@platform.com"))
        {
            adminUser = new User
            {
                Name = "Platform Admin",
                Email = "admin@platform.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded admin user.");
        }
        else
        {
            adminUser = await context.Users.FirstAsync(u => u.Email == "admin@platform.com");
        }

        User dealerUser;
        if (!await context.Users.AnyAsync(u => u.Email == "dealer@platform.com"))
        {
            dealerUser = new User
            {
                Name = "Sample Dealer",
                Email = "dealer@platform.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dealer123!"),
                Role = UserRole.Dealer,
                DealerId = null,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(dealerUser);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded dealer user.");
        }
        else
        {
            dealerUser = await context.Users.FirstAsync(u => u.Email == "dealer@platform.com");
        }

        Organization organization;
        if (!await context.Organizations.AnyAsync(o => o.Name == "Contoso Corp"))
        {
            organization = new Organization
            {
                Name = "Contoso Corp",
                DealerId = dealerUser.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Organizations.Add(organization);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded organization 'Contoso Corp'.");
        }
        else
        {
            organization = await context.Organizations.FirstAsync(o => o.Name == "Contoso Corp");
        }

        if (!await context.Users.AnyAsync(u => u.Email == "client@platform.com"))
        {
            var clientUser = new User
            {
                Name = "Contoso Client",
                Email = "client@platform.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Client123!"),
                Role = UserRole.Client,
                DealerId = dealerUser.Id,
                OrganizationId = organization.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(clientUser);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded client user.");
        }

        Zone mainEntranceZone;
        Zone serverRoomZone;

        if (!await context.Zones.AnyAsync(z => z.Name == "Main Entrance" && z.OrganizationId == organization.Id))
        {
            mainEntranceZone = new Zone
            {
                Name = "Main Entrance",
                OrganizationId = organization.Id
            };
            context.Zones.Add(mainEntranceZone);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded zone 'Main Entrance'.");
        }
        else
        {
            mainEntranceZone = await context.Zones.FirstAsync(z => z.Name == "Main Entrance" && z.OrganizationId == organization.Id);
        }

        if (!await context.Zones.AnyAsync(z => z.Name == "Server Room" && z.OrganizationId == organization.Id))
        {
            serverRoomZone = new Zone
            {
                Name = "Server Room",
                OrganizationId = organization.Id
            };
            context.Zones.Add(serverRoomZone);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded zone 'Server Room'.");
        }
        else
        {
            serverRoomZone = await context.Zones.FirstAsync(z => z.Name == "Server Room" && z.OrganizationId == organization.Id);
        }

        Reader mainEntranceReader;
        Reader serverRoomReader;

        if (!await context.Readers.AnyAsync(r => r.Name == "Main Entrance Reader" && r.ZoneId == mainEntranceZone.Id))
        {
            mainEntranceReader = new Reader
            {
                SerialNumber = "ACR-SEED0001",
                ApiKey = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
                Name = "Main Entrance Reader",
                DealerId = dealerUser.Id,
                OrganizationId = organization.Id,
                ZoneId = mainEntranceZone.Id,
                AssignedToDealerAt = DateTime.UtcNow,
                AssignedToOrganizationAt = DateTime.UtcNow
            };
            context.Readers.Add(mainEntranceReader);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded reader 'Main Entrance Reader'.");
        }
        else
        {
            mainEntranceReader = await context.Readers.FirstAsync(r => r.Name == "Main Entrance Reader" && r.ZoneId == mainEntranceZone.Id);
        }

        if (!await context.Readers.AnyAsync(r => r.Name == "Server Room Reader" && r.ZoneId == serverRoomZone.Id))
        {
            serverRoomReader = new Reader
            {
                SerialNumber = "ACR-SEED0002",
                ApiKey = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
                Name = "Server Room Reader",
                DealerId = dealerUser.Id,
                OrganizationId = organization.Id,
                ZoneId = serverRoomZone.Id,
                AssignedToDealerAt = DateTime.UtcNow,
                AssignedToOrganizationAt = DateTime.UtcNow
            };
            context.Readers.Add(serverRoomReader);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded reader 'Server Room Reader'.");
        }
        else
        {
            serverRoomReader = await context.Readers.FirstAsync(r => r.Name == "Server Room Reader" && r.ZoneId == serverRoomZone.Id);
        }

        Employee aliceSmith;
        Employee bobJones;

        if (!await context.Employees.AnyAsync(e => e.Name == "Alice Smith" && e.OrganizationId == organization.Id))
        {
            aliceSmith = new Employee
            {
                Name = "Alice Smith",
                OrganizationId = organization.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Employees.Add(aliceSmith);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded employee 'Alice Smith'.");
        }
        else
        {
            aliceSmith = await context.Employees.FirstAsync(e => e.Name == "Alice Smith" && e.OrganizationId == organization.Id);
        }

        if (!await context.Employees.AnyAsync(e => e.Name == "Bob Jones" && e.OrganizationId == organization.Id))
        {
            bobJones = new Employee
            {
                Name = "Bob Jones",
                OrganizationId = organization.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Employees.Add(bobJones);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded employee 'Bob Jones'.");
        }
        else
        {
            bobJones = await context.Employees.FirstAsync(e => e.Name == "Bob Jones" && e.OrganizationId == organization.Id);
        }

        Card aliceCard;
        Card bobCard;

        if (!await context.Cards.AnyAsync(c => c.UID == "AABBCCDD"))
        {
            aliceCard = new Card
            {
                UID = "AABBCCDD",
                OrganizationId = organization.Id,
                AssignedToEmployeeId = aliceSmith.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Cards.Add(aliceCard);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded card 'AABBCCDD' (Alice).");
        }
        else
        {
            aliceCard = await context.Cards.FirstAsync(c => c.UID == "AABBCCDD");
        }

        if (!await context.Cards.AnyAsync(c => c.UID == "11223344"))
        {
            bobCard = new Card
            {
                UID = "11223344",
                OrganizationId = organization.Id,
                AssignedToEmployeeId = bobJones.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Cards.Add(bobCard);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded card '11223344' (Bob).");
        }
        else
        {
            bobCard = await context.Cards.FirstAsync(c => c.UID == "11223344");
        }

        Schedule businessHoursSchedule;

        if (!await context.Schedules.AnyAsync(s => s.Name == "Business Hours" && s.OrganizationId == organization.Id))
        {
            businessHoursSchedule = new Schedule
            {
                Name = "Business Hours",
                OrganizationId = organization.Id,
                TimeFrom = new TimeOnly(8, 0),
                TimeTo = new TimeOnly(18, 0),
                DaysOfWeek = "Mon,Tue,Wed,Thu,Fri"
            };
            context.Schedules.Add(businessHoursSchedule);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded schedule 'Business Hours'.");
        }
        else
        {
            businessHoursSchedule = await context.Schedules.FirstAsync(s => s.Name == "Business Hours" && s.OrganizationId == organization.Id);
        }

        if (!await context.AccessRules.AnyAsync(ar =>
            ar.EmployeeId == aliceSmith.Id &&
            ar.ZoneId == mainEntranceZone.Id &&
            ar.ScheduleId == businessHoursSchedule.Id))
        {
            var accessRule = new AccessRule
            {
                EmployeeId = aliceSmith.Id,
                ZoneId = mainEntranceZone.Id,
                ScheduleId = businessHoursSchedule.Id
            };
            context.AccessRules.Add(accessRule);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded access rule for Alice Smith -> Main Entrance.");
        }

        if (!await context.AccessLogs.AnyAsync())
        {
            var baseTime = DateTime.UtcNow.AddHours(-24);

            var logs = new List<AccessLog>
            {
                new AccessLog
                {
                    CardUID = "AABBCCDD",
                    ReaderId = mainEntranceReader.Id,
                    Timestamp = baseTime.AddHours(1),
                    Decision = AccessDecision.Granted,
                    Reason = "Access granted"
                },
                new AccessLog
                {
                    CardUID = "AABBCCDD",
                    ReaderId = mainEntranceReader.Id,
                    Timestamp = baseTime.AddHours(2),
                    Decision = AccessDecision.Granted,
                    Reason = "Access granted"
                },
                new AccessLog
                {
                    CardUID = "AABBCCDD",
                    ReaderId = mainEntranceReader.Id,
                    Timestamp = baseTime.AddHours(9),
                    Decision = AccessDecision.Granted,
                    Reason = "Access granted"
                },
                new AccessLog
                {
                    CardUID = "11223344",
                    ReaderId = mainEntranceReader.Id,
                    Timestamp = baseTime.AddHours(3),
                    Decision = AccessDecision.Granted,
                    Reason = "Access granted"
                },
                new AccessLog
                {
                    CardUID = "11223344",
                    ReaderId = serverRoomReader.Id,
                    Timestamp = baseTime.AddHours(4),
                    Decision = AccessDecision.Granted,
                    Reason = "Access granted"
                },
                new AccessLog
                {
                    CardUID = "AABBCCDD",
                    ReaderId = serverRoomReader.Id,
                    Timestamp = baseTime.AddHours(5),
                    Decision = AccessDecision.Denied,
                    Reason = "No access rule"
                },
                new AccessLog
                {
                    CardUID = "DEADBEEF",
                    ReaderId = mainEntranceReader.Id,
                    Timestamp = baseTime.AddHours(6),
                    Decision = AccessDecision.Denied,
                    Reason = "Card not registered"
                }
            };

            context.AccessLogs.AddRange(logs);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} access logs.", logs.Count);
        }

        logger.LogInformation("Database seeding completed successfully.");
    }
}
