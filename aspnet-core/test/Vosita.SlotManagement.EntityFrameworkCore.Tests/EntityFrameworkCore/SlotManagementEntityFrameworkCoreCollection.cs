using Xunit;

namespace Vosita.SlotManagement.EntityFrameworkCore;

[CollectionDefinition(SlotManagementTestConsts.CollectionDefinitionName)]
public class SlotManagementEntityFrameworkCoreCollection : ICollectionFixture<SlotManagementEntityFrameworkCoreFixture>
{

}
