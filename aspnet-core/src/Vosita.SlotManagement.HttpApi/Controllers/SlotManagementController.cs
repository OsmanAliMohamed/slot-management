using Vosita.SlotManagement.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace Vosita.SlotManagement.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class SlotManagementController : AbpControllerBase
{
    protected SlotManagementController()
    {
        LocalizationResource = typeof(SlotManagementResource);
    }
}
