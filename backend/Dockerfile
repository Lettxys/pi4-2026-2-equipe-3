FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/System.Api/System.Api.csproj src/System.Api/
RUN dotnet restore src/System.Api/System.Api.csproj
COPY src/ src/

RUN dotnet publish src/System.Api/System.Api.csproj \
      --configuration Release \
      --output /app/publish \
      --no-restore \
      /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=3000 \
    DOTNET_NOLOGO=1 \
    DOTNET_EnableDiagnostics=0

EXPOSE 3000

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "System.Api.dll"]
