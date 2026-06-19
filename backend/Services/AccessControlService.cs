using AccessControlPlatform.Data;
using AccessControlPlatform.Models;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Services;

public class AccessControlService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AccessControlService> _logger;

    public AccessControlService(AppDbContext context, ILogger<AccessControlService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(AccessDecision decision, string reason)> EvaluateAccess(string cardUID, int readerId)
    {
        var card = await _context.Cards
            .Include(c => c.AssignedToEmployee)
            .FirstOrDefaultAsync(c => c.UID == cardUID);

        if (card == null)
            return (AccessDecision.Denied, "Card not registered");

        if (card.AssignedToEmployeeId == null || card.AssignedToEmployee == null)
            return (AccessDecision.Denied, "Card not assigned");

        var employee = card.AssignedToEmployee;

        var reader = await _context.Readers
            .Include(r => r.Zone)
            .FirstOrDefaultAsync(r => r.Id == readerId);

        if (reader == null)
            return (AccessDecision.Denied, "Reader not found");

        if (reader.OrganizationId == null)
            return (AccessDecision.Denied, "Reader not deployed yet");

        if (card.OrganizationId != reader.OrganizationId)
            return (AccessDecision.Denied, "Card does not belong to this organization");

        if (reader.ZoneId == null)
            return (AccessDecision.Denied, "Reader not assigned to a zone");

        var zoneId = reader.ZoneId.Value;

        var accessRules = await _context.AccessRules
            .Include(ar => ar.Schedule)
            .Where(ar => ar.EmployeeId == employee.Id && ar.ZoneId == zoneId)
            .ToListAsync();

        if (accessRules.Count == 0)
            return (AccessDecision.Denied, "No access rule");

        var now = DateTime.Now;
        var currentTime = TimeOnly.FromDateTime(now);
        var currentDay = GetDayAbbreviation(now.DayOfWeek);

        foreach (var rule in accessRules)
        {
            if (rule.Schedule == null) continue;
            if (IsWithinSchedule(rule.Schedule, currentDay, currentTime))
                return (AccessDecision.Granted, "Access granted");
        }

        return (AccessDecision.Denied, "Outside allowed schedule");
    }

    private static bool IsWithinSchedule(Schedule schedule, string currentDay, TimeOnly currentTime)
    {
        var allowedDays = schedule.DaysOfWeek
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        bool dayOk = allowedDays.Any(d => string.Equals(d, currentDay, StringComparison.OrdinalIgnoreCase));
        if (!dayOk) return false;

        if (schedule.TimeFrom <= schedule.TimeTo)
            return currentTime >= schedule.TimeFrom && currentTime <= schedule.TimeTo;

        return currentTime >= schedule.TimeFrom || currentTime <= schedule.TimeTo;
    }

    public async Task SaveAccessLog(string cardUID, int? readerId, AccessDecision decision, string reason)
    {
        var log = new AccessLog
        {
            CardUID = cardUID,
            ReaderId = readerId,
            Timestamp = DateTime.UtcNow,
            Decision = decision,
            Reason = reason
        };

        _context.AccessLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    private static string GetDayAbbreviation(DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Monday => "Mon",
            DayOfWeek.Tuesday => "Tue",
            DayOfWeek.Wednesday => "Wed",
            DayOfWeek.Thursday => "Thu",
            DayOfWeek.Friday => "Fri",
            DayOfWeek.Saturday => "Sat",
            DayOfWeek.Sunday => "Sun",
            _ => string.Empty
        };
    }
}
