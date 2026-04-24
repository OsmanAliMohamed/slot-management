using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace Vosita.SlotManagement.Slots;

public interface ISlotAppService : IApplicationService
{
    Task<GenerateSlotsResultDto> GenerateSlotsAsync(GenerateSlotsInput input);
    Task<List<SlotDto>> GetNextSlotsAsync(string timeZone, int count = 20);
    Task<PagedSlotsResultDto> GetAllSlotsAsync(int page = 1, int pageSize = 20, string? status = null, string timeZone = "UTC");
    Task<SlotDto> BookSlotAsync(System.Guid slotId);
    Task<SlotStatsDto> GetSlotStatsAsync();
}
