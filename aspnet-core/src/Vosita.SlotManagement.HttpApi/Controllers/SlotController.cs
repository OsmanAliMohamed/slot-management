using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Vosita.SlotManagement.Slots;

namespace Vosita.SlotManagement.Controllers;

[RemoteService]
[Area("app")]
[Route("api/app/slots")]
public class SlotController : SlotManagementController
{
    private readonly ISlotAppService _slotAppService;

    public SlotController(ISlotAppService slotAppService)
    {
        _slotAppService = slotAppService;
    }

    [HttpPost("generate")]
    [Authorize(Roles = "admin")]
    public async Task<GenerateSlotsResultDto> GenerateSlotsAsync([FromBody] GenerateSlotsInput input)
        => await _slotAppService.GenerateSlotsAsync(input);

    [HttpGet("next")]
    public async Task<List<SlotDto>> GetNextSlotsAsync([FromQuery] string timeZone, [FromQuery] int count = 20)
        => await _slotAppService.GetNextSlotsAsync(timeZone, count);

    [HttpGet]
    public async Task<PagedSlotsResultDto> GetAllSlotsAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string timeZone = "UTC")
        => await _slotAppService.GetAllSlotsAsync(page, pageSize, status, timeZone);

    [HttpPost("{id}/book")]
    public async Task<SlotDto> BookSlotAsync(Guid id)
        => await _slotAppService.BookSlotAsync(id);

    [HttpGet("stats")]
    [Authorize(Roles = "admin")]
    public async Task<SlotStatsDto> GetSlotStatsAsync()
        => await _slotAppService.GetSlotStatsAsync();
}
