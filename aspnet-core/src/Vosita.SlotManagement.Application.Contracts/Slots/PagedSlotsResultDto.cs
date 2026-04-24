using System.Collections.Generic;

namespace Vosita.SlotManagement.Slots;

public class PagedSlotsResultDto
{
    public List<SlotDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (TotalCount + PageSize - 1) / PageSize : 0;
}
