using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NodaTime;
using Volo.Abp.EntityFrameworkCore.Modeling;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using Vosita.SlotManagement.Slots;

namespace Vosita.SlotManagement.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class SlotManagementDbContext :
    AbpDbContext<SlotManagementDbContext>,
    IIdentityDbContext,
    ITenantManagementDbContext
{
    public DbSet<Slot> Slots { get; set; }

    #region Entities from the modules

    //Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public SlotManagementDbContext(DbContextOptions<SlotManagementDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureFeatureManagement();
        builder.ConfigureTenantManagement();

        // Convert NodaTime Instant to UTC DateTime for SQL Server datetime2 storage
        var instantConverter = new ValueConverter<Instant, DateTime>(
            instant => instant.ToDateTimeUtc(),
            dt => Instant.FromDateTimeUtc(DateTime.SpecifyKind(dt, DateTimeKind.Utc))
        );

        builder.Entity<Slot>(b =>
        {
            b.ToTable(SlotManagementConsts.DbTablePrefix + "Slots", SlotManagementConsts.DbSchema);
            b.ConfigureByConvention();
            b.Property(s => s.StartInstant).HasConversion(instantConverter).HasColumnType("datetime2");
            b.Property(s => s.EndInstant).HasConversion(instantConverter).HasColumnType("datetime2");
            b.Property(s => s.CreationTimeZone).HasMaxLength(100).IsRequired();
            b.Property(s => s.Status).IsRequired();
            b.HasIndex(s => s.StartInstant);
            b.HasIndex(s => s.Status);
        });
    }
}
