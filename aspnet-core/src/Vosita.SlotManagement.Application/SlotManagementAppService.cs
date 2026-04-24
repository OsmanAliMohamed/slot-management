using System;
using System.Collections.Generic;
using System.Text;
using Vosita.SlotManagement.Localization;
using Volo.Abp.Application.Services;

namespace Vosita.SlotManagement;

/* Inherit your application services from this class.
 */
public abstract class SlotManagementAppService : ApplicationService
{
    protected SlotManagementAppService()
    {
        LocalizationResource = typeof(SlotManagementResource);
    }
}
