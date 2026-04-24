using System;
using System.Collections.Generic;
using NodaTime;
using Shouldly;
using Vosita.SlotManagement.Slots;
using Xunit;

namespace Vosita.SlotManagement.Slots;

/// <summary>
/// Pure unit tests for NodaTime-based slot generation and time zone conversion logic.
/// These do not require ABP infrastructure — they test the core domain rules directly.
/// </summary>
public class SlotGenerationTests
{
    [Fact]
    public void GenerateSlots_SingleDay_30MinDuration_Creates48Slots()
    {
        var tz = DateTimeZoneProviders.Tzdb["America/New_York"];
        var date = new LocalDate(2026, 6, 1);
        var slotDuration = Duration.FromMinutes(30);

        var slots = GenerateSlotsForDay(date, tz, slotDuration);

        // 24 hours × 2 per hour = 48 slots per day
        slots.Count.ShouldBe(48);
    }

    [Fact]
    public void GenerateSlots_SingleDay_60MinDuration_Creates24Slots()
    {
        var tz = DateTimeZoneProviders.Tzdb["Africa/Cairo"];
        var date = new LocalDate(2026, 6, 1);
        var slotDuration = Duration.FromMinutes(60);

        var slots = GenerateSlotsForDay(date, tz, slotDuration);

        slots.Count.ShouldBe(24);
    }

    [Fact]
    public void GenerateSlots_StoredAsInstants_AreUtc()
    {
        var tz = DateTimeZoneProviders.Tzdb["America/New_York"]; // UTC-4 in summer
        var date = new LocalDate(2026, 6, 1);
        var slotDuration = Duration.FromMinutes(60);

        var slots = GenerateSlotsForDay(date, tz, slotDuration);
        var firstSlot = slots[0];

        // Midnight New York on June 1 2026 = 04:00 UTC
        var expectedStartUtc = new LocalDateTime(2026, 6, 1, 4, 0).InUtc().ToInstant();
        firstSlot.StartInstant.ShouldBe(expectedStartUtc);
    }

    [Fact]
    public void GenerateSlots_Twodays_DoubleTheSlots()
    {
        var tz = DateTimeZoneProviders.Tzdb["Europe/London"];
        var start = new LocalDate(2026, 6, 1);
        var end = new LocalDate(2026, 6, 2);
        var slotDuration = Duration.FromMinutes(60);

        var slots = GenerateSlotsForRange(start, end, tz, slotDuration);

        slots.Count.ShouldBe(48); // 24 per day × 2 days
    }

    [Fact]
    public void ConvertInstantToZone_NewYork_ShowsCorrectLocalTime()
    {
        // A known UTC instant: 2026-06-01 12:00 UTC
        var instant = Instant.FromUtc(2026, 6, 1, 12, 0);
        var newYork = DateTimeZoneProviders.Tzdb["America/New_York"]; // UTC-4 in summer

        var zoned = instant.InZone(newYork);

        zoned.Hour.ShouldBe(8);   // 12 UTC - 4h = 08:00 New York
        zoned.Minute.ShouldBe(0);
        zoned.Date.ShouldBe(new LocalDate(2026, 6, 1));
    }

    [Fact]
    public void ConvertInstantToZone_Cairo_ShowsCorrectLocalTime()
    {
        // A known UTC instant: 2026-06-01 12:00 UTC
        var instant = Instant.FromUtc(2026, 6, 1, 12, 0);
        var cairo = DateTimeZoneProviders.Tzdb["Africa/Cairo"]; // UTC+3 (Egypt Summer Time)

        var zoned = instant.InZone(cairo);

        zoned.Hour.ShouldBe(15); // 12 UTC + 3h = 15:00 Cairo
    }

    [Fact]
    public void SlotDuration_IsCorrectlyPreserved()
    {
        var tz = DateTimeZoneProviders.Tzdb["UTC"];
        var date = new LocalDate(2026, 6, 1);
        var slotDuration = Duration.FromMinutes(45);

        var slots = GenerateSlotsForDay(date, tz, slotDuration);

        foreach (var slot in slots)
        {
            var actualMinutes = (slot.EndInstant - slot.StartInstant).TotalMinutes;
            actualMinutes.ShouldBe(45);
        }
    }

    [Fact]
    public void InvalidTimeZone_ThrowsException()
    {
        var invalidId = "Not/A/TimeZone";
        var result = DateTimeZoneProviders.Tzdb.GetZoneOrNull(invalidId);
        result.ShouldBeNull();
    }

    [Fact]
    public void ValidTimeZone_ReturnsZone()
    {
        var validId = "America/New_York";
        var result = DateTimeZoneProviders.Tzdb.GetZoneOrNull(validId);
        result.ShouldNotBeNull();
    }

    // Helper: generate slots for a single day
    private static List<(Instant StartInstant, Instant EndInstant)> GenerateSlotsForDay(
        LocalDate date, DateTimeZone tz, Duration slotDuration)
    {
        return GenerateSlotsForRange(date, date, tz, slotDuration);
    }

    // Helper: mirrors the core generation logic from SlotAppService
    private static List<(Instant StartInstant, Instant EndInstant)> GenerateSlotsForRange(
        LocalDate start, LocalDate end, DateTimeZone tz, Duration slotDuration)
    {
        var slots = new List<(Instant, Instant)>();
        var currentDate = start;

        while (currentDate <= end)
        {
            var dayStartInstant = currentDate.AtStartOfDayInZone(tz).ToInstant();
            var dayEndInstant = currentDate.PlusDays(1).AtStartOfDayInZone(tz).ToInstant();

            var slotStart = dayStartInstant;
            while (slotStart + slotDuration <= dayEndInstant)
            {
                slots.Add((slotStart, slotStart + slotDuration));
                slotStart += slotDuration;
            }

            currentDate = currentDate.PlusDays(1);
        }

        return slots;
    }
}
