using AccessControlPlatform.Data;
using AccessControlPlatform.Models;
using AccessControlPlatform.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccessControlPlatform.Controllers;

[ApiController]
[Route("api/card-reader")]
public class CardReaderController : ControllerBase
{
    private readonly AccessControlService _accessControlService;
    private readonly AppDbContext _context;
    private readonly ILogger<CardReaderController> _logger;

    public CardReaderController(AccessControlService accessControlService, AppDbContext context, ILogger<CardReaderController> logger)
    {
        _accessControlService = accessControlService;
        _context = context;
        _logger = logger;
    }

    [HttpPost("scan")]
    public async Task<IActionResult> Scan([FromBody] CardScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CardUID))
            return BadRequest(new { message = "CardUID is required." });

        if (request.ReaderId <= 0)
            return BadRequest(new { message = "A valid ReaderId is required." });

        if (!Request.Headers.TryGetValue("X-Reader-Key", out var providedKey) || string.IsNullOrWhiteSpace(providedKey))
            return Unauthorized(new { message = "Missing reader API key." });

        var reader = await _context.Readers.FirstOrDefaultAsync(r => r.Id == request.ReaderId);
        if (reader == null)
            return Unauthorized(new { message = "Unknown reader." });

        if (reader.ApiKey != providedKey.ToString())
            return Unauthorized(new { message = "Invalid reader API key." });

        (AccessDecision decision, string reason) = await _accessControlService.EvaluateAccess(request.CardUID, request.ReaderId);
        await _accessControlService.SaveAccessLog(request.CardUID, request.ReaderId, decision, reason);

        return Ok(new CardScanResponse
        {
            CardUID = request.CardUID,
            ReaderId = request.ReaderId,
            Decision = decision.ToString(),
            Reason = reason,
            Timestamp = DateTime.UtcNow
        });
    }
}

public class CardScanRequest
{
    public string CardUID { get; set; } = string.Empty;
    public int ReaderId { get; set; }
}

public class CardScanResponse
{
    public string CardUID { get; set; } = string.Empty;
    public int ReaderId { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
