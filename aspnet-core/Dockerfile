FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore src/Vosita.SlotManagement.HttpApi.Host/Vosita.SlotManagement.HttpApi.Host.csproj
RUN dotnet publish src/Vosita.SlotManagement.HttpApi.Host/Vosita.SlotManagement.HttpApi.Host.csproj \
    -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Vosita.SlotManagement.HttpApi.Host.dll"]
