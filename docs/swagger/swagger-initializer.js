window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    urls: [
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/auth.yml", name: "auth service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/http.yml", name: "http service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/alarms.yml", name: "alarms service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/certs.yml", name: "certs service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/notifiers.yml", name: "notifiers service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/readers.yml", name: "readers service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/rules.yml", name: "rules service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/things.yml", name: "things service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/users.yml", name: "users service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/webhooks.yml", name: "webhooks service" },
        { url: "https://raw.githubusercontent.com/MainfluxLabs/mainflux/refs/heads/master/api/openapi/websocket.yml", name: "websocket service" },
    ],
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });

  //</editor-fold>
};
