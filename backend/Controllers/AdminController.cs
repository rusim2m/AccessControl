using AccessControlPlatform.Data;
using AccessControlPlatform.DTOs;
using AccessControlPlatform.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new
        {
            totalOrganizations = await _context.Organizations.CountAsync(),
            totalDealers = await _context.Users.CountAsync(u => u.Role == UserRole.Dealer),
            totalCards = await _context.Cards.CountAsync(),
            totalReaders = await _context.Readers.CountAsync(),
            totalEmployees = await _context.Employees.CountAsync()
        };
        return Ok(stats);
    }

    [HttpGet("dealers")]
    public async Task<IActionResult> GetDealers()
    {
        var dealers = await _context.Users
            .Where(u => u.Role == UserRole.Dealer)
            .OrderBy(u => u.Name)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString(),
                DealerId = u.DealerId,
                OrganizationId = u.OrganizationId,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(dealers);
    }

    [HttpPost("dealers")]
    public async Task<IActionResult> CreateDealer([FromBody] CreateUserRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return BadRequest(new { message = "A user with this email already exists." });

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Dealer,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created dealer {Email}", user.Email);

        return CreatedAtAction(nameof(GetDealers), new { id = user.Id }, new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            DealerId = user.DealerId,
            OrganizationId = user.OrganizationId,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPut("dealers/{id:int}")]
    public async Task<IActionResult> UpdateDealer(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Dealer);
        if (user == null)
            return NotFound(new { message = "Dealer not found." });

        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrWhiteSpace(request.Email) &&
            !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != id))
                return BadRequest(new { message = "Email already in use." });
            user.Email = request.Email;
        }

        await _context.SaveChangesAsync();

        return Ok(new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            DealerId = user.DealerId,
            OrganizationId = user.OrganizationId,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpDelete("dealers/{id:int}")]
    public async Task<IActionResult> DeleteDealer(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Dealer);
        if (user == null)
            return NotFound(new { message = "Dealer not found." });

        var hasOrgs = await _context.Organizations.AnyAsync(o => o.DealerId == id);
        if (hasOrgs)
            return BadRequest(new { message = "Cannot delete dealer: they still have organizations assigned." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("organizations")]
    public async Task<IActionResult> GetOrganizations()
    {
        var orgs = await _context.Organizations
            .Include(o => o.Dealer)
            .OrderBy(o => o.Name)
            .Select(o => new OrganizationResponse
            {
                Id = o.Id,
                Name = o.Name,
                DealerId = o.DealerId,
                DealerName = o.Dealer != null ? o.Dealer.Name : string.Empty,
                CreatedAt = o.CreatedAt,
                CardCount = o.Cards.Count,
                ReaderCount = _context.Readers.Count(r => r.OrganizationId == o.Id)
            })
            .ToListAsync();

        return Ok(orgs);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Role)
            .ThenBy(u => u.Name)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString(),
                DealerId = u.DealerId,
                OrganizationId = u.OrganizationId,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("devices")]
    public async Task<IActionResult> GetDevices()
    {
        var devices = await _context.Readers
            .Include(r => r.Dealer)
            .Include(r => r.Organization)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new InventoryDeviceResponse
            {
                Id = r.Id,
                SerialNumber = r.SerialNumber,
                DealerId = r.DealerId,
                DealerName = r.Dealer != null ? r.Dealer.Name : null,
                OrganizationId = r.OrganizationId,
                OrganizationName = r.Organization != null ? r.Organization.Name : null,
                AssignedToDealerAt = r.AssignedToDealerAt,
                AssignedToOrganizationAt = r.AssignedToOrganizationAt,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(devices);
    }

    [HttpPost("devices")]
    public async Task<IActionResult> ManufactureDevice()
    {
        string serial;
        do
        {
            serial = "ACR-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        } while (await _context.Readers.AnyAsync(r => r.SerialNumber == serial));

        var apiKey = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

        var reader = new Reader
        {
            SerialNumber = serial,
            ApiKey = apiKey,
            CreatedAt = DateTime.UtcNow
        };

        _context.Readers.Add(reader);
        await _context.SaveChangesAsync();

        return Ok(new InventoryDeviceResponse
        {
            Id = reader.Id,
            SerialNumber = reader.SerialNumber,
            CreatedAt = reader.CreatedAt
        });
    }

    [HttpPut("devices/{id:int}/assign-dealer")]
    public async Task<IActionResult> AssignDeviceToDealer(int id, [FromBody] AssignDeviceToDealerRequest request)
    {
        var reader = await _context.Readers.FirstOrDefaultAsync(r => r.Id == id);
        if (reader == null)
            return NotFound(new { message = $"Device {id} not found." });

        var dealer = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.DealerId && u.Role == UserRole.Dealer);
        if (dealer == null)
            return NotFound(new { message = $"Dealer {request.DealerId} not found." });

        if (reader.OrganizationId != null)
            return BadRequest(new { message = "Device is already deployed to an organization; cannot reassign dealer." });

        reader.DealerId = request.DealerId;
        reader.AssignedToDealerAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new InventoryDeviceResponse
        {
            Id = reader.Id,
            SerialNumber = reader.SerialNumber,
            DealerId = dealer.Id,
            DealerName = dealer.Name,
            AssignedToDealerAt = reader.AssignedToDealerAt,
            CreatedAt = reader.CreatedAt
        });
    }
}
