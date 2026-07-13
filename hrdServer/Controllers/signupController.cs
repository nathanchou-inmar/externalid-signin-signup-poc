using Microsoft.AspNetCore.Mvc;
using MGModels = Microsoft.Graph.Beta.Models;
using Microsoft.Graph.Beta;
using Microsoft.Graph.Beta.Models.ODataErrors;
using Azure.Identity;
using Azure.Core;
using System.ClientModel.Primitives;

[ApiController]
[Route("/api/HelloWorld")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Ping()
    {
        return Ok(new
        {
            message="I got pressed"
        });
    }

    public record Input(string message);
    [HttpPost]
    public IActionResult Push([FromBody] Input input)
    {
        Console.Write(input.message);
        return Ok(new
        {
            output=input.message
        });
    }
}
[ApiController]
[Route("/api/checkOTL")]
public class OTLController : ControllerBase
{
    public record Input(string? token);
    [HttpPost]
    public IActionResult checkOTL([FromBody] Input input)
    {
        Console.WriteLine($"api received: {input.token}");
        if (input.token != null && input.token.Equals("abc123"))
        {
            return Ok(new
            {
                output=input.token
            });
        } else
        {
            return Unauthorized(new
            {
                message="Token was null or invalid"
            });
        }
    }
}

[ApiController]
[Route("/api/oidc")]
public class OIDCController : ControllerBase{
    public record Input(
        string displayName,
        string domain,
        string endpoint,
        string clientId,
        string clientSecret
    );

    private GraphServiceClient graph;
    private ClientSecretCredential cred;
    private HttpClient http;

    public OIDCController(GraphServiceClient graphService, ClientSecretCredential credential, IHttpClientFactory httpClientFactory)
    {
        graph = graphService;
        cred = credential;
        http = httpClientFactory.CreateClient("GraphAPI");
    }


    private AccessToken token;
    
    public async Task getToken()
    {
        token = await cred.GetTokenAsync(
            new TokenRequestContext(["https://graph.microsoft.com/.default"]));
        Console.WriteLine($"token received");
    }
    public async Task<ObjectResult> attachToFlow(String idpId) {
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);

        var path =
            $"identity/authenticationEventsFlows/{Environment.GetEnvironmentVariable("USER_FLOW_ID")}" +
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
            return Problem(detail: err, statusCode: (int)response.StatusCode);
        }

        return Ok(new { 
            idp = idpId,
            flow = Environment.GetEnvironmentVariable("USER_FLOW_ID"),
            success = true
        });     
    }
    [HttpPost]
    public async Task<IActionResult> createOIDC([FromBody] Input input) {
        var idp = new MGModels.OidcIdentityProvider
        {
            OdataType = "#microsoft.graph.OidcIdentityProvider",
            DisplayName = input.displayName,
            Issuer = input.domain,
            WellKnownEndpoint = input.endpoint,
            ClientId = input.clientId,
            ResponseType = MGModels.OidcResponseType.Code,
            Scope = "openid profile email",
            ClientAuthentication = new MGModels.OidcClientSecretAuthentication
            {
                OdataType = "#microsoft.graph.oidcClientSecretAuthentication",
                ClientSecret = input.clientSecret,
            },
        };

        if (idp.Issuer.Length < 8) {
            return Problem(detail: "Domain is too short", statusCode: 400);
        }
        if (!Uri.TryCreate(idp.Issuer, UriKind.Absolute, out _) || !idp.Issuer.Substring(0,8).Equals("https://")) {
            return Problem(detail: "Issuer Invalid", statusCode: 400);
        }
        if (!Uri.TryCreate(idp.WellKnownEndpoint, UriKind.Absolute, out _) || 
            !idp.WellKnownEndpoint.Substring(0,8).Equals("https://") ||
            !idp.WellKnownEndpoint.Contains(".well-known/openid-configuration")
            ) {
            return Problem(detail: "WKE Invalid", statusCode: 400);
        }
        if (idp.WellKnownEndpoint[idp.WellKnownEndpoint.Length - 1].Equals('/') || idp.Issuer[idp.Issuer.Length - 1].Equals('/')) {
            return Problem(detail: "No trailing /", statusCode: 400);
        }
        
        bool entra = idp.WellKnownEndpoint.Split("/")[2].Equals("login.microsoftonline.com");
        bool initial = idp.Issuer.Contains(".onmicrosoft.com/v2.0");
        if (entra && !initial) {
            return Problem(detail: "If entra tenant, need initial domain (.onmicrosoft.com)", statusCode: 400);
        }

        try {
            await getToken();
            var result = await graph.Identity.IdentityProviders.PostAsync(idp);
            Console.WriteLine($"created: {result?.Id}");

            if (result?.Id == null){
                Console.WriteLine("failed creation");
                return Problem(detail: "IDP created but ID was null", statusCode: 500);
            };
            var output = await attachToFlow(result.Id);
            if (output.StatusCode != 200) {
                Console.WriteLine("failed after creation");
                return Problem(detail: "Attatching to flow failed", statusCode: 500);
            }
            Console.WriteLine($"attatched: {result.Id}");
            return Ok(new { message = "created with IdP Id: ", id = result.Id });
        }
        catch (ODataError e) {
            return Problem(detail: e.Message, statusCode: 500);
        }
    }
}