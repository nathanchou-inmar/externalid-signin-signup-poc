using Microsoft.AspNetCore.Mvc;
using MGModels = Microsoft.Graph.Beta.Models;
using Microsoft.Graph.Beta;
using Microsoft.Graph.Beta.Models.ODataErrors;
using Azure.Identity;
using Azure.Core;
using System.ClientModel.Primitives;

/// <summary>
/// Validates the single-use invite token (one-time link, "OTL") that gates access
/// to the self-service sign-up page. The React client calls this before rendering
/// the sign-up form and redirects the user away when the token is missing or invalid.
/// </summary>
[ApiController]
[Route("/api/checkOTL")]
public class OTLController : ControllerBase
{
    public record Input(string? token);

    /// <summary>
    /// Verifies that the supplied invite token is present and valid.
    /// </summary>
    /// <param name="input">The request body containing the token to validate.</param>
    /// <returns>
    /// <c>200 OK</c> with the token echoed in an <c>output</c> field when valid;
    /// otherwise <c>401 Unauthorized</c> with an error message.
    /// </returns>
    /// <response code="200">The token is valid; the caller may proceed to sign-up.</response>
    /// <response code="401">The token was null or did not match.</response>
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

/// <summary>
/// Registers a customer's OpenID Connect (OIDC) identity provider in the Entra
/// External ID tenant and wires it into the self-service sign-up user flow, so that
/// end users can federate in through that provider.
/// </summary>
/// <remarks>
/// Requires the <c>USER_FLOW_ID</c> environment variable (the target self-service
/// sign-up flow). Authentication uses the app-only <see cref="ClientSecretCredential"/>
/// configured in <c>Program.cs</c>, which must hold the
/// <c>IdentityProvider.ReadWrite.All</c> and <c>EventListener.ReadWrite.All</c>
/// Microsoft Graph application permissions.
/// </remarks>
[ApiController]
[Route("/api/oidc")]
public class OIDCController : ControllerBase{
    /// <summary>
    /// Request body describing the OIDC identity provider to create.
    /// </summary>
    /// <param name="displayName">Friendly name shown for the provider in Entra.</param>
    /// <param name="domain">The provider's issuer URL (must be absolute HTTPS with no trailing slash).</param>
    /// <param name="endpoint">The provider's OpenID Connect discovery document URL (must end in <c>.well-known/openid-configuration</c>).</param>
    /// <param name="clientId">The client/application ID registered with the OIDC provider.</param>
    /// <param name="clientSecret">The client secret used to authenticate to the OIDC provider.</param>
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

    /// <summary>
    /// Initializes the controller with the Graph SDK client, the app-only credential,
    /// and a named <see cref="HttpClient"/> pre-configured with the Graph beta base address.
    /// </summary>
    /// <param name="graphService">Strongly-typed Microsoft Graph beta client used to create the identity provider.</param>
    /// <param name="credential">App-only client credential used to acquire Graph access tokens.</param>
    /// <param name="httpClientFactory">Factory used to obtain the named <c>"GraphAPI"</c> client for raw Graph calls.</param>
    public OIDCController(GraphServiceClient graphService, ClientSecretCredential credential, IHttpClientFactory httpClientFactory)
    {
        graph = graphService;
        cred = credential;
        http = httpClientFactory.CreateClient("GraphAPI");
    }


    private AccessToken token;
    
    /// <summary>
    /// Acquires an app-only Microsoft Graph access token via the client-credentials
    /// flow and caches it in <see cref="token"/> for subsequent raw Graph calls.
    /// </summary>
    /// <returns>A task that completes once the token has been acquired and cached.</returns>
    public async Task getToken()
    {
        token = await cred.GetTokenAsync(
            new TokenRequestContext(["https://graph.microsoft.com/.default"]));
        Console.WriteLine($"token received");
    }
    /// <summary>
    /// Attaches an existing identity provider to the configured self-service sign-up
    /// user flow by adding it to the flow's <c>onAuthenticationMethodLoadStart</c>
    /// event, so it appears as a sign-in option.
    /// </summary>
    /// <param name="idpId">The object ID of the identity provider to attach (as returned by Graph when it was created).</param>
    /// <returns>
    /// <c>200 OK</c> describing the attached provider and flow on success; otherwise a
    /// problem result carrying the Graph error detail and status code.
    /// </returns>
    /// <remarks>
    /// Issues a raw Graph <c>$ref</c> POST using the token cached by
    /// <see cref="getToken"/>, so <see cref="getToken"/> must be called first. The
    /// target flow is identified by the <c>USER_FLOW_ID</c> environment variable.
    /// </remarks>
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
    /// <summary>
    /// Validates the supplied OIDC provider details, creates the provider in Entra
    /// External ID via Microsoft Graph, and attaches it to the sign-up user flow.
    /// </summary>
    /// <param name="input">The OIDC provider details to register.</param>
    /// <returns>
    /// <c>200 OK</c> with the new identity provider's ID on success;
    /// <c>400 Bad Request</c> when validation fails; or <c>500</c> when creation or
    /// attachment fails.
    /// </returns>
    /// <remarks>
    /// Validation enforces an absolute HTTPS issuer and discovery endpoint, no trailing
    /// slashes, a well-known OpenID configuration URL, and — for Entra issuers — use of
    /// the initial <c>.onmicrosoft.com</c> domain. On success the provider is both
    /// created and wired into the flow via <see cref="attachToFlow"/>.
    /// </remarks>
    /// <response code="200">The provider was created and attached to the flow.</response>
    /// <response code="400">The supplied provider details failed validation.</response>
    /// <response code="500">The provider could not be created or attached.</response>
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