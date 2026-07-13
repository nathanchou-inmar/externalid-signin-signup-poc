using Azure.Identity;
using Microsoft.Graph.Beta;


DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Client Injection
builder.Services.AddSingleton<ClientSecretCredential>(_ =>
{
    var tenantId = Environment.GetEnvironmentVariable("TENANT_ID");
    var clientId = Environment.GetEnvironmentVariable("GRAPH_CLIENT_ID");
    var clientSecret = Environment.GetEnvironmentVariable("GRAPH_CLIENT_SECRET");
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
});

builder.Services.AddSingleton<GraphServiceClient>(sp =>
{
    var credential = sp.GetRequiredService<ClientSecretCredential>();
    return new(credential, ["https://graph.microsoft.com/.default"]);
});

builder.Services.AddHttpClient("GraphAPI", client =>
{
   client.BaseAddress = new Uri("https://graph.microsoft.com/beta/");
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();