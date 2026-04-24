using Microsoft.Extensions.Localization;
using Vosita.SlotManagement.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace Vosita.SlotManagement;

[Dependency(ReplaceServices = true)]
public class SlotManagementBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<SlotManagementResource> _localizer;

    public SlotManagementBrandingProvider(IStringLocalizer<SlotManagementResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
