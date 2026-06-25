using System.Security.Claims;
using AccessControlPlatform.Data;
using AccessControlPlatform.DTOs;
using AccessControlPlatform.Models;
using AccessControlPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Controllers;

[ApiController]
[Route("api/dealer")]
[Authorize(Roles = "Dealer")]
public class DealerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CardProvisioningService _cardProvisioning;
    private readonly ILogger<DealerController> _logger;

    public DealerController(AppDbContext context, CardProvisioningService cardProvisioning, ILogger<DealerController> logger)
    {
        _context = context;
        _cardProvisioning = cardProvisioning;
        _logger = logger;
    }

    private int GetCurrentDealerId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub")
               ?? throw new UnauthorizedAccessException("User ID claim missing.");
        return int.Parse(sub);
    }

    [HttpGet("organizations")]
    public async Task<IActionResult> GetOrganizations()
    {
        var dealerId = GetCurrentDealerId();

        var orgs = await _context.Organizations
            .Include(o => o.Dealer)
            .Where(o => o.DealerId == dealerId)
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

    [HttpPost("organizations")]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationRequest request)
    {
        var dealerId = GetCurrentDealerId();

        var org = new Organization
        {
            Name = request.Name,
            DealerId = dealerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(org);
        await _context.SaveChangesAsync();

        var dealer = await _context.Users.FindAsync(dealerId);

        return Ok(new OrganizationResponse
        {
            Id = org.Id,
            Name = org.Name,
            DealerId = org.DealerId,
            DealerName = dealer?.Name ?? string.Empty,
            CreatedAt = org.CreatedAt,
            CardCount = 0,
            ReaderCount = 0
        });
    }

    [HttpPut("organizations/{id:int}")]
    public async Task<IActionResult> UpdateOrganization(int id, [FromBody] UpdateOrganizationRequest request)
    {
        var dealerId = GetCurrentDealerId();

        var org = await _context.Organizations
            .Include(o => o.Dealer)
            .FirstOrDefaultAsync(o => o.Id == id && o.DealerId == dealerId);

        if (org == null)
            return NotFound(new { message = "Organization not found." });

        org.Name = request.Name;
        await _context.SaveChangesAsync();

        return Ok(new OrganizationResponse
        {
            Id = org.Id,
            Name = org.Name,
            DealerId = org.DealerId,
            DealerName = org.Dealer?.Name ?? string.Empty,
            CreatedAt = org.CreatedAt,
            CardCount = await _context.Cards.CountAsync(c => c.OrganizationId == org.Id),
            ReaderCount = await _context.Readers.CountAsync(r => r.OrganizationId == org.Id)
        });
    }

    [HttpDelete("organizations/{id:int}")]
    public async Task<IActionResult> DeleteOrganization(int id)
    {
        var dealerId = GetCurrentDealerId();

        var org = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == id && o.DealerId == dealerId);

        if (org == null)
            return NotFound(new { message = "Organization not found." });

        _context.Organizations.Remove(org);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("clients")]
    public async Task<IActionResult> GetClients()
    {
        var dealerId = GetCurrentDealerId();

        var orgIds = await _context.Organizations
            .Where(o => o.DealerId == dealerId)
            .Select(o => o.Id)
            .ToListAsync();

        var clients = await _context.Users
            .Where(u => u.Role == UserRole.Client && u.OrganizationId.HasValue && orgIds.Contains(u.OrganizationId.Value))
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

        return Ok(clients);
    }

    [HttpPost("clients")]
    public async Task<IActionResult> CreateClient([FromBody] CreateUserRequest request)
    {
        var dealerId = GetCurrentDealerId();

        if (!request.OrganizationId.HasValue)
            return BadRequest(new { message = "OrganizationId is required." });

        var org = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == request.OrganizationId && o.DealerId == dealerId);

        if (org == null)
            return NotFound(new { message = "Organization not found." });

        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return BadRequest(new { message = "A user with this email already exists." });

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Client,
            DealerId = dealerId,
            OrganizationId = request.OrganizationId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
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

    [HttpPut("clients/{id:int}")]
    public async Task<IActionResult> UpdateClient(int id, [FromBody] UpdateUserRequest request)
    {
        var dealerId = GetCurrentDealerId();

        var orgIds = await _context.Organizations
            .Where(o => o.DealerId == dealerId)
            .Select(o => o.Id)
            .ToListAsync();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client
                && u.OrganizationId.HasValue && orgIds.Contains(u.OrganizationId.Value));

        if (user == null)
            return NotFound(new { message = "Client not found." });

        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrWhiteSpace(request.Email) &&
            !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != id))
                return BadRequest(new { message = "Email already in use." });
            user.Email = request.Email;
        }

        if (request.OrganizationId.HasValue)
        {
            if (!orgIds.Contains(request.OrganizationId.Value))
                return BadRequest(new { message = "Organization not found or not owned by you." });
            user.OrganizationId = request.OrganizationId.Value;
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

    [HttpDelete("clients/{id:int}")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        var dealerId = GetCurrentDealerId();

        var orgIds = await _context.Organizations
            .Where(o => o.DealerId == dealerId)
            .Select(o => o.Id)
            .ToListAsync();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Client
                && u.OrganizationId.HasValue && orgIds.Contains(u.OrganizationId.Value));

        if (user == null)
            return NotFound(new { message = "Client not found." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("readers")]
    public async Task<IActionResult> GetReaders()
    {
        var dealerId = GetCurrentDealerId();

        var readers = await _context.Readers
            .Include(r => r.Organization)
            .Include(r => r.Zone)
            .Where(r => r.DealerId == dealerId)
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

    [HttpPut("readers/{id:int}/assign-organization")]
    public async Task<IActionResult> AssignReaderToOrganization(int id, [FromBody] AssignReaderToOrganizationRequest request)
    {
        var dealerId = GetCurrentDealerId();

        var reader = await _context.Readers.FirstOrDefaultAsync(r => r.Id == id);
        if (reader == null)
            return NotFound(new { message = $"Device {id} not found." });

        if (reader.DealerId != dealerId)
            return Forbid();

        if (reader.OrganizationId != null)
            return BadRequest(new { message = "Device is already deployed to an organization." });

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == request.OrganizationId);
        if (org == null)
            return NotFound(new { message = $"Organization {request.OrganizationId} not found." });

        if (org.DealerId != dealerId)
            return Forbid();

        reader.OrganizationId = request.OrganizationId;
        reader.Name = string.IsNullOrWhiteSpace(request.Name) ? reader.SerialNumber : request.Name;
        reader.AssignedToOrganizationAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new ReaderResponse
        {
            Id = reader.Id,
            SerialNumber = reader.SerialNumber,
            Name = reader.Name,
            OrganizationId = reader.OrganizationId,
            OrganizationName = org.Name,
            ZoneId = null,
            ZoneName = null,
            AssignedToOrganizationAt = reader.AssignedToOrganizationAt
        });
    }

    [HttpGet("readers/{id:int}/config")]
    public async Task<IActionResult> DownloadReaderConfig(int id)
    {
        var dealerId = GetCurrentDealerId();

        var reader = await _context.Readers.FirstOrDefaultAsync(r => r.Id == id);
        if (reader == null)
            return NotFound(new { message = $"Device {id} not found." });

        if (reader.DealerId != dealerId)
            return Forbid();

        if (reader.OrganizationId == null)
            return BadRequest(new { message = "Deploy the device to an organization before downloading its configuration." });

        var backendUrl = $"{Request.Scheme}://{Request.Host}";

        var config = new
        {
            backendUrl = backendUrl,
            readerId = reader.Id,
            serialNumber = reader.SerialNumber,
            apiKey = reader.ApiKey
        };

        var json = System.Text.Json.JsonSerializer.Serialize(config, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        var bytes = System.Text.Encoding.UTF8.GetBytes(json);
        var fileName = $"bridge.{reader.SerialNumber}.config.json";

        return File(bytes, "application/json", fileName);
    }

    [HttpGet("cards")]
    public async Task<IActionResult> GetCards()
    {
        var dealerId = GetCurrentDealerId();

        var orgIds = await _context.Organizations
            .Where(o => o.DealerId == dealerId)
            .Select(o => o.Id)
            .ToListAsync();

        var cards = await _context.Cards
            .Include(c => c.Organization)
            .Include(c => c.AssignedToEmployee)
            .Where(c => orgIds.Contains(c.OrganizationId))
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

    [HttpPost("cards/provision")]
    public async Task<IActionResult> ProvisionCard([FromBody] ProvisionCardRequest request, CancellationToken ct)
    {
        var dealerId = GetCurrentDealerId();

        if (request.OrganizationId <= 0)
            return BadRequest(new { message = "An organization must be selected for the card." });

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == request.OrganizationId, ct);
        if (org == null)
            return NotFound(new { message = $"Organization {request.OrganizationId} not found." });

        if (org.DealerId != dealerId)
            return Forbid();

        string? uid;
        try
        {
            uid = await _cardProvisioning.WaitForCardTapAsync(TimeSpan.FromSeconds(30), ct);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }

        if (string.IsNullOrEmpty(uid))
            return BadRequest(new { message = "No card was tapped within the time limit." });

        if (await _context.Cards.AnyAsync(c => c.UID == uid, ct))
            return BadRequest(new { message = $"A card with UID '{uid}' is already registered." });

        var card = new Card
        {
            UID = uid,
            OrganizationId = request.OrganizationId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Cards.Add(card);
        await _context.SaveChangesAsync(ct);

        return Ok(new CardResponse
        {
            Id = card.Id,
            UID = card.UID,
            OrganizationId = card.OrganizationId,
            OrganizationName = org.Name,
            AssignedToEmployeeId = null,
            AssignedToEmployeeName = null,
            CreatedAt = card.CreatedAt
        });
    }

    [HttpPost("cards")]
    public async Task<IActionResult> CreateCard([FromBody] CreateCardRequest request)
    {
        var dealerId = GetCurrentDealerId();

        if (request.OrganizationId <= 0)
            return BadRequest(new { message = "An organization must be selected for the card." });

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == request.OrganizationId);
        if (org == null)
            return NotFound(new { message = $"Organization {request.OrganizationId} not found." });

        if (org.DealerId != dealerId)
            return Forbid();

        if (await _context.Cards.AnyAsync(c => c.UID == request.UID))
            return BadRequest(new { message = $"A card with UID '{request.UID}' already exists." });

        var card = new Card
        {
            UID = request.UID,
            OrganizationId = request.OrganizationId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Cards.Add(card);
        await _context.SaveChangesAsync();

        return Ok(new CardResponse
        {
            Id = card.Id,
            UID = card.UID,
            OrganizationId = card.OrganizationId,
            OrganizationName = org.Name,
            AssignedToEmployeeId = null,
            AssignedToEmployeeName = null,
            CreatedAt = card.CreatedAt
        });
    }
}
