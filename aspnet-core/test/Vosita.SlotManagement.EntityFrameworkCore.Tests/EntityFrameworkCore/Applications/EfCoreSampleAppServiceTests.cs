using Vosita.SlotManagement.Samples;
using Xunit;

namespace Vosita.SlotManagement.EntityFrameworkCore.Applications;

[Collection(SlotManagementTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<SlotManagementEntityFrameworkCoreTestModule>
{

}
