using System.ComponentModel.DataAnnotations;

namespace Vosita.SlotManagement.Slots;

public class GenerateSlotsInput
{
    [Required]
    public string StartDate { get; set; } = default!; // "YYYY-MM-DD"

    [Required]
    public string EndDate { get; set; } = default!;   // "YYYY-MM-DD"

    [Required]
    public string TimeZone { get; set; } = default!;

    [Range(1, int.MaxValue, ErrorMessage = "SlotDuration must be greater than 0.")]
    public int SlotDuration { get; set; } // minutes
}
