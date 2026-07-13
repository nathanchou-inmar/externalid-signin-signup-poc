using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Graph;
using MGModels = Microsoft.Graph.Models;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// CORS: a service that attatches headers to allow the front and backend to communicate
builder.Services.AddCors(o => o.AddPolicy("dev", p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors("dev");

// Created once, reused by all endpoints
var cred = new ClientSecretCredential(
    Environment.GetEnvironmentVariable("TENANT_ID"),
    Environment.GetEnvironmentVariable("GRAPH_CLIENT_ID"),
    Environment.GetEnvironmentVariable("GRAPH_CLIENT_SECRET"));
var graph = new GraphServiceClient(cred, ["https://graph.microsoft.com/.default"]);
var http = new HttpClient { BaseAddress = new Uri("https://graph.microsoft.com/beta/") };

// GET /api/token
app.MapGet("/api/token", async () =>
{
    var token = await cred.GetTokenAsync(
        new TokenRequestContext(["https://graph.microsoft.com/.default"]));
    return Results.Ok(new { token = token.Token });
});

// GET /api/idps
app.MapGet("/api/idps", async () =>
{
    var result = await graph.Identity.IdentityProviders
        .GetAsync(req => req.QueryParameters.Select = ["id", "displayName"]);
    return Results.Ok(result?.Value ?? []);
});

// POST /api/idps  -- body: CreateIdpRequest
app.MapPost("/api/idps", async Task<IResult> ([FromBody] CreateIdpRequest body) =>
{
    var idp = new MGModels.OidcIdentityProvider
    {
        OdataType = "#microsoft.graph.OidcIdentityProvider",
        DisplayName = body.DisplayName,
        Issuer = body.Issuer,
        WellKnownEndpoint = body.WellKnownEndpoint,
        ClientId = body.ClientId,
        ResponseType = MGModels.OidcResponseType.Code,
        Scope = body.Scope,
        ClientAuthentication = new MGModels.OidcClientSecretAuthentication
        {
            OdataType = "#microsoft.graph.oidcClientSecretAuthentication",
            ClientSecret = body.ClientSecret,
        },
    };

    var result = await graph.Identity.IdentityProviders.PostAsync(idp);
    return Results.Ok(result);
});

// POST /api/userflows/{flowId}/idps/{idpId}
app.MapPost("/api/userflows/{flowId}/idps/{idpId}", async Task<IResult> (
    string flowId,
    string idpId) =>
{
    var token = await cred.GetTokenAsync(
        new TokenRequestContext(["https://graph.microsoft.com/.default"]));

    http.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);

    var path =
        $"identity/authenticationEventsFlows/{flowId}" +
        "/microsoft.graph.externalUsersSelfServiceSignUpEventsFlow" +
        "/onAuthenticationMethodLoadStart" +
        "/microsoft.graph.onAuthenticationMethodLoadStartExternalUsersSelfServiceSignUp" +
        "/identityProviders/$ref";

    var payload = System.Text.Json.JsonSerializer.Serialize(
        new Dictionary<string, string>
        {
            ["@odata.id"] = $"https://graph.microsoft.com/beta/identityProviders/{idpId}"
        });

    var response = await http.PostAsync(path,
        new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

    if (!response.IsSuccessStatusCode)
    {
        var err = await response.Content.ReadAsStringAsync();
        return Results.Problem(err, statusCode: (int)response.StatusCode);
    }

    return Results.Ok(new { success = true });
});

app.Run();

record CreateIdpRequest(
    string DisplayName,
    string Issuer,
    string WellKnownEndpoint,
    string ClientId,
    string ClientSecret,
    string Scope);
