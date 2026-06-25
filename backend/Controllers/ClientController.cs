using System.Security.Claims;
using AccessControlPlatform.Data;
using AccessControlPlatform.DTOs;
using AccessControlPlatform.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Controllers;

[ApiController]
[Route("api/client")]
[Authorize(Roles = "Client")]
public class ClientController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientController(AppDbContext context)
    {
        _context = context;
    }

    private int GetOrganizationId()
    {
        var orgIdClaim = User.FindFirstValue("organizationId")
            ?? throw new UnauthorizedAccessException("OrganizationId claim missing.");
        return int.Parse(orgIdClaim);
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        var orgId = GetOrganizationId();

        var employees = await _context.Employees
            .Include(e => e.Card)
            .Where(e => e.OrganizationId == orgId)
            .OrderBy(e => e.Name)
            .Select(e => new EmployeeResponse
            {
                Id = e.Id,
                Name = e.Name,
                OrganizationId = e.OrganizationId,
                CardId = e.Card != null ? e.Card.Id : (int?)null,
                CardUID = e.Card != null ? e.Card.UID : null,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("employees/{id:int}")]
    public async Task<IActionResult> GetEmployee(int id)
    {
        var orgId = GetOrganizationId();

        var employee = await _context.Employees
            .Include(e => e.Card)
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);

        if (employee == null)
            return NotFound(new { message = $"Employee {id} not found." });

        return Ok(new EmployeeResponse
        {
            Id = employee.Id,
            Name = employee.Name,
            OrganizationId = employee.OrganizationId,
            CardId = employee.Card?.Id,
            CardUID = employee.Card?.UID,
            CreatedAt = employee.CreatedAt
        });
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
    {
        var orgId = GetOrganizationId();

        var employee = new Employee
        {
            Name = request.Name,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return Ok(new EmployeeResponse
        {
            Id = employee.Id,
            Name = employee.Name,
            OrganizationId = employee.OrganizationId,
            CreatedAt = employee.CreatedAt
        });
    }

    [HttpPut("employees/{id:int}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var orgId = GetOrganizationId();

        var employee = await _context.Employees
            .Include(e => e.Card)
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);

        if (employee == null)
            return NotFound(new { message = $"Employee {id} not found." });

        employee.Name = request.Name;
        await _context.SaveChangesAsync();

        return Ok(new EmployeeResponse
        {
            Id = employee.Id,
            Name = employee.Name,
            OrganizationId = employee.OrganizationId,
            CardId = employee.Card?.Id,
            CardUID = employee.Card?.UID,
            CreatedAt = employee.CreatedAt
        });
    }

    [HttpDelete("employees/{id:int}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var orgId = GetOrganizationId();

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);

        if (employee == null)
            return NotFound(new { message = $"Employee {id} not found." });

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("zones")]
    public async Task<IActionResult> GetZones()
    {
        var orgId = GetOrganizationId();

        var zones = await _context.Zones
            .Where(z => z.OrganizationId == orgId)
            .OrderBy(z => z.Name)
            .Select(z => new ZoneResponse
            {
                Id = z.Id,
                Name = z.Name,
                OrganizationId = z.OrganizationId,
                ReaderCount = z.Readers.Count
            })
            .ToListAsync();

        return Ok(zones);
    }

    [HttpGet("zones/{id:int}")]
    public async Task<IActionResult> GetZone(int id)
    {
        var orgId = GetOrganizationId();

        var zone = await _context.Zones
            .Include(z => z.Readers)
            .FirstOrDefaultAsync(z => z.Id == id && z.OrganizationId == orgId);

        if (zone == null)
            return NotFound(new { message = $"Zone {id} not found." });

        return Ok(new ZoneResponse
        {
            Id = zone.Id,
            Name = zone.Name,
            OrganizationId = zone.OrganizationId,
            ReaderCount = zone.Readers.Count
        });
    }

    [HttpPost("zones")]
    public async Task<IActionResult> CreateZone([FromBody] CreateZoneRequest request)
    {
        var orgId = GetOrganizationId();

        var zone = new Zone
        {
            Name = request.Name,
            OrganizationId = orgId
        };

        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();

        return Ok(new ZoneResponse
        {
            Id = zone.Id,
            Name = zone.Name,
            OrganizationId = zone.OrganizationId,
            ReaderCount = 0
        });
    }

    [HttpPut("zones/{id:int}")]
    public async Task<IActionResult> UpdateZone(int id, [FromBody] UpdateZoneRequest request)
    {
        var orgId = GetOrganizationId();

        var zone = await _context.Zones
            .Include(z => z.Readers)
            .FirstOrDefaultAsync(z => z.Id == id && z.OrganizationId == orgId);

        if (zone == null)
            return NotFound(new { message = $"Zone {id} not found." });

        zone.Name = request.Name;
        await _context.SaveChangesAsync();

        return Ok(new ZoneResponse
        {
            Id = zone.Id,
            Name = zone.Name,
            OrganizationId = zone.OrganizationId,
            ReaderCount = zone.Readers.Count
        });
    }

    [HttpDelete("zones/{id:int}")]
    public async Task<IActionResult> DeleteZone(int id)
    {
        var orgId = GetOrganizationId();

        var zone = await _context.Zones
            .FirstOrDefaultAsync(z => z.Id == id && z.OrganizationId == orgId);

        if (zone == null)
            return NotFound(new { message = $"Zone {id} not found." });

        _context.Zones.Remove(zone);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("cards")]
    public async Task<IActionResult> GetCards()
    {
        var orgId = GetOrganizationId();

        var cards = await _context.Cards
            .Include(c => c.Organization)
            .Include(c => c.AssignedToEmployee)
            .Where(c => c.OrganizationId == orgId)
            .OrderBy(c => c.UID)
            .Select(c => new CardResponse
            {
                Id = c.Id,
                UID = c.UID,
                OrganizationId = c.OrganizationId,
                OrganizationName = c.Organization != null ? c.Organization.Name : string.Empty,
                AssignedToEmployeeId = c.AssignedToEmployeeId,
                AssignedToEmployeeName = c.AssignedToEmployee != null ? c.AssignedToEmployee.Name : null,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(cards);
    }

    [HttpPost("cards")]
    public async Task<IActionResult> CreateCard([FromBody] CreateCardRequest request)
    {
        var orgId = GetOrganizationId();

        if (await _context.Cards.AnyAsync(c => c.UID == request.UID))
            return BadRequest(new { message = $"A card with UID '{request.UID}' already exists." });

        var card = new Card
        {
            UID = request.UID,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Cards.Add(card);
        await _context.SaveChangesAsync();

        var org = await _context.Organizations.FindAsync(orgId);

        return Ok(new CardResponse
        {
            Id = card.Id,
            UID = card.UID,
            OrganizationId = card.OrganizationId,
            OrganizationName = org?.Name ?? string.Empty,
            CreatedAt = card.CreatedAt
        });
    }

    [HttpPut("cards/{id:int}/assign")]
    public async Task<IActionResult> AssignCard(int id, [FromBody] AssignCardRequest request)
    {
        var orgId = GetOrganizationId();

        var card = await _context.Cards
            .Include(c => c.Organization)
            .Include(c => c.AssignedToEmployee)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);

        if (card == null)
            return NotFound(new { message = $"Card {id} not found." });

        if (request.EmployeeId == null)
        {
            card.AssignedToEmployeeId = null;
            await _context.SaveChangesAsync();
            return Ok(new CardResponse
            {
                Id = card.Id,
                UID = card.UID,
                    OrganizationId = card.OrganizationId,
                OrganizationName = card.Organization?.Name ?? string.Empty,
                AssignedToEmployeeId = null,
                AssignedToEmployeeName = null,
                CreatedAt = card.CreatedAt
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.OrganizationId == orgId);

        if (employee == null)
            return NotFound(new { message = $"Employee {request.EmployeeId} not found." });

        var existingCard = await _context.Cards
            .FirstOrDefaultAsync(c => c.AssignedToEmployeeId == request.EmployeeId && c.Id != id);
        if (existingCard != null)
            existingCard.AssignedToEmployeeId = null;

        card.AssignedToEmployeeId = request.EmployeeId;
        await _context.SaveChangesAsync();

        return Ok(new CardResponse
        {
            Id = card.Id,
            UID = card.UID,
            OrganizationId = card.OrganizationId,
            OrganizationName = card.Organization?.Name ?? string.Empty,
            AssignedToEmployeeId = card.AssignedToEmployeeId,
            AssignedToEmployeeName = employee.Name,
            CreatedAt = card.CreatedAt
        });
    }

    [HttpGet("readers")]
    public async Task<IActionResult> GetReaders()
    {
        var orgId = GetOrganizationId();

        var readers = await _context.Readers
            .Include(r => r.Organization)
            .Include(r => r.Zone)
            .Where(r => r.OrganizationId == orgId)
            .OrderBy(r => r.Name)
            .Select(r => new ReaderResponse
            {
                Id = r.Id,
                SerialNumber = r.SerialNumber,
                Name = r.Name,
                OrganizationId = r.OrganizationId,
                OrganizationName = r.Organization != null ? r.Organization.Name : null,
                ZoneId = r.ZoneId,
                ZoneName = r.Zone != null ? r.Zone.Name : null,
                AssignedToOrganizationAt = r.AssignedToOrganizationAt
            })
            .ToListAsync();

        return Ok(readers);
    }

    [HttpPut("readers/{id:int}/assign-zone")]
    public async Task<IActionResult> AssignReaderToZone(int id, [FromBody] AssignReaderToZoneRequest request)
    {
        var orgId = GetOrganizationId();

        var reader = await _context.Readers
            .Include(r => r.Organization)
            .Include(r => r.Zone)
            .FirstOrDefaultAsync(r => r.Id == id && r.OrganizationId == orgId);

        if (reader == null)
            return NotFound(new { message = $"Reader {id} not found." });

        if (request.ZoneId != null)
        {
            var zone = await _context.Zones
                .FirstOrDefaultAsync(z => z.Id == request.ZoneId && z.OrganizationId == orgId);

            if (zone == null)
                return NotFound(new { message = $"Zone {request.ZoneId} not found." });
        }

        reader.ZoneId = request.ZoneId;
        await _context.SaveChangesAsync();

        await _context.Entry(reader).Reference(r => r.Zone).LoadAsync();

        return Ok(new ReaderResponse
        {
            Id = reader.Id,
            SerialNumber = reader.SerialNumber,
            Name = reader.Name,
            OrganizationId = reader.OrganizationId,
            OrganizationName = reader.Organization?.Name,
            ZoneId = reader.ZoneId,
            ZoneName = reader.Zone?.Name,
            AssignedToOrganizationAt = reader.AssignedToOrganizationAt
        });
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetSchedules()
    {
        var orgId = GetOrganizationId();

        var schedules = await _context.Schedules
            .Where(s => s.OrganizationId == orgId)
            .OrderBy(s => s.Name)
            .Select(s => new ScheduleResponse
            {
                Id = s.Id,
                Name = s.Name,
                OrganizationId = s.OrganizationId,
                TimeFrom = s.TimeFrom.ToString("HH:mm"),
                TimeTo = s.TimeTo.ToString("HH:mm"),
                DaysOfWeek = s.DaysOfWeek
            })
            .ToListAsync();

        return Ok(schedules);
    }

    [HttpGet("schedules/{id:int}")]
    public async Task<IActionResult> GetSchedule(int id)
    {
        var orgId = GetOrganizationId();

        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId);

        if (schedule == null)
            return NotFound(new { message = $"Schedule {id} not found." });

        return Ok(new ScheduleResponse
        {
            Id = schedule.Id,
            Name = schedule.Name,
            OrganizationId = schedule.OrganizationId,
            TimeFrom = schedule.TimeFrom.ToString("HH:mm"),
            TimeTo = schedule.TimeTo.ToString("HH:mm"),
            DaysOfWeek = schedule.DaysOfWeek
        });
    }

    [HttpPost("schedules")]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleRequest request)
    {
        var orgId = GetOrganizationId();

        if (!TimeOnly.TryParseExact(request.TimeFrom, "HH:mm", out var timeFrom))
            return BadRequest(new { message = "Invalid TimeFrom format. Use HH:mm." });

        if (!TimeOnly.TryParseExact(request.TimeTo, "HH:mm", out var timeTo))
            return BadRequest(new { message = "Invalid TimeTo format. Use HH:mm." });

        var schedule = new Schedule
        {
            Name = request.Name,
            OrganizationId = orgId,
            TimeFrom = timeFrom,
            TimeTo = timeTo,
            DaysOfWeek = request.DaysOfWeek
        };

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        return Ok(new ScheduleResponse
        {
            Id = schedule.Id,
            Name = schedule.Name,
            OrganizationId = schedule.OrganizationId,
            TimeFrom = schedule.TimeFrom.ToString("HH:mm"),
            TimeTo = schedule.TimeTo.ToString("HH:mm"),
            DaysOfWeek = schedule.DaysOfWeek
        });
    }

    [HttpPut("schedules/{id:int}")]
    public async Task<IActionResult> UpdateSchedule(int id, [FromBody] UpdateScheduleRequest request)
    {
        var orgId = GetOrganizationId();

        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId);

        if (schedule == null)
            return NotFound(new { message = $"Schedule {id} not found." });

        if (!TimeOnly.TryParseExact(request.TimeFrom, "HH:mm", out var timeFrom))
            return BadRequest(new { message = "Invalid TimeFrom format. Use HH:mm." });

        if (!TimeOnly.TryParseExact(request.TimeTo, "HH:mm", out var timeTo))
            return BadRequest(new { message = "Invalid TimeTo format. Use HH:mm." });

        schedule.Name = request.Name;
        schedule.TimeFrom = timeFrom;
        schedule.TimeTo = timeTo;
        schedule.DaysOfWeek = request.DaysOfWeek;
        await _context.SaveChangesAsync();

        return Ok(new ScheduleResponse
        {
            Id = schedule.Id,
            Name = schedule.Name,
            OrganizationId = schedule.OrganizationId,
            TimeFrom = schedule.TimeFrom.ToString("HH:mm"),
            TimeTo = schedule.TimeTo.ToString("HH:mm"),
            DaysOfWeek = schedule.DaysOfWeek
        });
    }

    [HttpDelete("schedules/{id:int}")]
    public async Task<IActionResult> DeleteSchedule(int id)
    {
        var orgId = GetOrganizationId();

        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId);

        if (schedule == null)
            return NotFound(new { message = $"Schedule {id} not found." });

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("access-rules")]
    public async Task<IActionResult> GetAccessRules()
    {
        var orgId = GetOrganizationId();

        var rules = await _context.AccessRules
            .Include(ar => ar.Employee)
            .Include(ar => ar.Zone)
            .Include(ar => ar.Schedule)
            .Where(ar => ar.Employee!.OrganizationId == orgId)
            .OrderBy(ar => ar.Employee!.Name)
            .Select(ar => new AccessRuleResponse
            {
                Id = ar.Id,
                EmployeeId = ar.EmployeeId,
                EmployeeName = ar.Employee != null ? ar.Employee.Name : string.Empty,
                ZoneId = ar.ZoneId,
                ZoneName = ar.Zone != null ? ar.Zone.Name : string.Empty,
                ScheduleId = ar.ScheduleId,
                ScheduleName = ar.Schedule != null ? ar.Schedule.Name : string.Empty
            })
            .ToListAsync();

        return Ok(rules);
    }

    [HttpPost("access-rules")]
    public async Task<IActionResult> CreateAccessRule([FromBody] CreateAccessRuleRequest request)
    {
        var orgId = GetOrganizationId();

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.OrganizationId == orgId);
        if (employee == null)
            return NotFound(new { message = $"Employee {request.EmployeeId} not found." });

        var zone = await _context.Zones
            .FirstOrDefaultAsync(z => z.Id == request.ZoneId && z.OrganizationId == orgId);
        if (zone == null)
            return NotFound(new { message = $"Zone {request.ZoneId} not found." });

        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId && s.OrganizationId == orgId);
        if (schedule == null)
            return NotFound(new { message = $"Schedule {request.ScheduleId} not found." });

        if (await _context.AccessRules.AnyAsync(ar =>
            ar.EmployeeId == request.EmployeeId &&
            ar.ZoneId == request.ZoneId &&
            ar.ScheduleId == request.ScheduleId))
        {
            return BadRequest(new { message = "This access rule already exists." });
        }

        var rule = new AccessRule
        {
            EmployeeId = request.EmployeeId,
            ZoneId = request.ZoneId,
            ScheduleId = request.ScheduleId
        };

        _context.AccessRules.Add(rule);
        await _context.SaveChangesAsync();

        return Ok(new AccessRuleResponse
        {
            Id = rule.Id,
            EmployeeId = rule.EmployeeId,
            EmployeeName = employee.Name,
            ZoneId = rule.ZoneId,
            ZoneName = zone.Name,
            ScheduleId = rule.ScheduleId,
            ScheduleName = schedule.Name
        });
    }

    [HttpPut("access-rules/{id:int}")]
    public async Task<IActionResult> UpdateAccessRule(int id, [FromBody] UpdateAccessRuleRequest request)
    {
        var orgId = GetOrganizationId();

        var rule = await _context.AccessRules
            .Include(ar => ar.Employee)
            .FirstOrDefaultAsync(ar => ar.Id == id && ar.Employee!.OrganizationId == orgId);

        if (rule == null)
            return NotFound(new { message = $"Access rule {id} not found." });

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.OrganizationId == orgId);
        if (employee == null)
            return NotFound(new { message = $"Employee {request.EmployeeId} not found." });

        var zone = await _context.Zones
            .FirstOrDefaultAsync(z => z.Id == request.ZoneId && z.OrganizationId == orgId);
        if (zone == null)
            return NotFound(new { message = $"Zone {request.ZoneId} not found." });

        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId && s.OrganizationId == orgId);
        if (schedule == null)
            return NotFound(new { message = $"Schedule {request.ScheduleId} not found." });

        if (await _context.AccessRules.AnyAsync(ar =>
            ar.EmployeeId == request.EmployeeId &&
            ar.ZoneId == request.ZoneId &&
            ar.ScheduleId == request.ScheduleId &&
            ar.Id != id))
        {
            return BadRequest(new { message = "This access rule already exists." });
        }

        rule.EmployeeId = request.EmployeeId;
        rule.ZoneId = request.ZoneId;
        rule.ScheduleId = request.ScheduleId;
        await _context.SaveChangesAsync();

        return Ok(new AccessRuleResponse
        {
            Id = rule.Id,
            EmployeeId = rule.EmployeeId,
            EmployeeName = employee.Name,
            ZoneId = rule.ZoneId,
            ZoneName = zone.Name,
            ScheduleId = rule.ScheduleId,
            ScheduleName = schedule.Name
        });
    }

    [HttpDelete("access-rules/{id:int}")]
    public async Task<IActionResult> DeleteAccessRule(int id)
    {
        var orgId = GetOrganizationId();

        var rule = await _context.AccessRules
            .Include(ar => ar.Employee)
            .FirstOrDefaultAsync(ar => ar.Id == id && ar.Employee!.OrganizationId == orgId);

        if (rule == null)
            return NotFound(new { message = $"Access rule {id} not found." });

        _context.AccessRules.Remove(rule);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("access-logs")]
    public async Task<IActionResult> GetAccessLogs()
    {
        var orgId = GetOrganizationId();

        var readerIds = await _context.Readers
            .Where(r => r.OrganizationId == orgId)
            .Select(r => r.Id)
            .ToListAsync();

        var logs = await _context.AccessLogs
            .Include(al => al.Reader)
                .ThenInclude(r => r!.Zone)
            .Where(al => al.ReaderId == null || readerIds.Contains(al.ReaderId.Value))
            .OrderByDescending(al => al.Timestamp)
            .Take(100)
            .Select(al => new AccessLogResponse
            {
                Id = al.Id,
                CardUID = al.CardUID,
                EmployeeName = _context.Cards
                    .Where(c => c.UID == al.CardUID && c.AssignedToEmployee != null)
                    .Select(c => c.AssignedToEmployee!.Name)
                    .FirstOrDefault(),
                ReaderId = al.ReaderId,
                ReaderName = al.Reader != null ? al.Reader.Name : null,
                ZoneName = al.Reader != null && al.Reader.Zone != null ? al.Reader.Zone.Name : null,
                Timestamp = al.Timestamp,
                Decision = al.Decision.ToString(),
                Reason = al.Reason
            })
            .ToListAsync();

        return Ok(logs);
    }
}
