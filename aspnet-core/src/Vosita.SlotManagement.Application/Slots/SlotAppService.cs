using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NodaTime;
using NodaTime.Text;
using Volo.Abp;

namespace Vosita.SlotManagement.Slots;

public class SlotAppService : SlotManagementAppService, ISlotAppService
{
    private readonly ISlotRepository _slotRepository;

    public SlotAppService(ISlotRepository slotRepository)
    {
        _slotRepository = slotRepository;
    }

    public async Task<GenerateSlotsResultDto> GenerateSlotsAsync(GenerateSlotsInput input)
    {
        var parseResult = LocalDatePattern.Iso.Parse(input.StartDate);
        if (!parseResult.Success)
            throw new UserFriendlyException("Invalid StartDate format. Use YYYY-MM-DD.");
        var startDate = parseResult.Value;

        var parseResult2 = LocalDatePattern.Iso.Parse(input.EndDate);
        if (!parseResult2.Success)
            throw new UserFriendlyException("Invalid EndDate format. Use YYYY-MM-DD.");
        var endDate = parseResult2.Value;

        if (startDate > endDate)
            throw new UserFriendlyException("StartDate must be less than or equal to EndDate.");

        if (input.SlotDuration <= 0)
            throw new UserFriendlyException("SlotDuration must be greater than 0.");

        var tz = DateTimeZoneProviders.Tzdb.GetZoneOrNull(input.TimeZone)
            ?? throw new UserFriendlyException($"Invalid time zone: '{input.TimeZone}'. Use a valid TZDB identifier (e.g., America/New_York).");

        var slotDuration = Duration.FromMinutes(input.SlotDuration);
        var slots = new List<Slot>();

        var currentDate = startDate;
        while (currentDate <= endDate)
        {
            var dayStartInstant = currentDate.AtStartOfDayInZone(tz).ToInstant();
            var dayEndInstant = currentDate.PlusDays(1).AtStartOfDayInZone(tz).ToInstant();

            var slotStart = dayStartInstant;
            while (slotStart + slotDuration <= dayEndInstant)
            {
                slots.Add(new Slot(
                    GuidGenerator.Create(),
                    slotStart,
                    slotStart + slotDuration,
                    input.TimeZone
                ));
                slotStart += slotDuration;
            }

            currentDate = currentDate.PlusDays(1);
        }

        await _slotRepository.InsertManyAsync(slots, autoSave: true);

        return new GenerateSlotsResultDto { TotalSlotsCreated = slots.Count };
    }

    public async Task<List<SlotDto>> GetNextSlotsAsync(string timeZone, int count = 20)
    {
        if (string.IsNullOrWhiteSpace(timeZone))
            throw new UserFriendlyException("TimeZone is required.");

        var tz = DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZone)
            ?? throw new UserFriendlyException($"Invalid time zone: '{timeZone}'.");

        var now = SystemClock.Instance.GetCurrentInstant();
        var slots = await _slotRepository.GetNextAvailableAsync(now, count);

        return slots.Select(s => MapToDto(s, tz)).ToList();
    }

    public async Task<PagedSlotsResultDto> GetAllSlotsAsync(
        int page = 1, int pageSize = 20, string? status = null, string timeZone = "UTC")
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var tz = DateTimeZoneProviders.Tzdb.GetZoneOrNull(timeZone ?? "UTC") ?? DateTimeZone.Utc;

        SlotStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<SlotStatus>(status, ignoreCase: true, out var parsed))
                statusFilter = parsed;
            else
                throw new UserFriendlyException($"Invalid status '{status}'. Valid values: Available, Booked.");
        }

        var (items, total) = await _slotRepository.GetPagedAsync(page, pageSize, statusFilter);

        return new PagedSlotsResultDto
        {
            Items = items.Select(s => MapToDto(s, tz)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<SlotDto> BookSlotAsync(Guid slotId)
    {
        var slot = await _slotRepository.GetAsync(slotId);

        if (slot.Status == SlotStatus.Booked)
            throw new UserFriendlyException("This slot is already booked.");

        slot.Status = SlotStatus.Booked;
        await _slotRepository.UpdateAsync(slot, autoSave: true);

        return MapToDto(slot, DateTimeZone.Utc);
    }

    public async Task<SlotStatsDto> GetSlotStatsAsync()
    {
        var (total, available, booked) = await _slotRepository.GetStatusCountsAsync();
        return new SlotStatsDto { TotalSlots = total, AvailableSlots = available, BookedSlots = booked };
    }

    private static SlotDto MapToDto(Slot slot, DateTimeZone tz)
    {
        var localStart = slot.StartInstant.InZone(tz);
        var localEnd = slot.EndInstant.InZone(tz);

        return new SlotDto
        {
            Id = slot.Id,
            LocalStartTime = localStart.ToString("yyyy-MM-dd HH:mm:ss o<+HH:mm>", null),
            LocalEndTime = localEnd.ToString("yyyy-MM-dd HH:mm:ss o<+HH:mm>", null),
            TimeZone = tz.Id,
            IsBookable = slot.Status == SlotStatus.Available,
            DurationMinutes = (int)(slot.EndInstant - slot.StartInstant).TotalMinutes
        };
    }
}
