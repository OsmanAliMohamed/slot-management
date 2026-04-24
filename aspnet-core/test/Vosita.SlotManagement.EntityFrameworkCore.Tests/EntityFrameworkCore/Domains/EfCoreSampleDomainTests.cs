using Vosita.SlotManagement.Samples;
using Xunit;

namespace Vosita.SlotManagement.EntityFrameworkCore.Domains;

[Collection(SlotManagementTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<SlotManagementEntityFrameworkCoreTestModule>
{

}
