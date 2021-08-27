const NGINX_DATA = require("./sites.json");
const fs = require("fs");

function generateConfig(site, ssl) {
  const domainRedirectFrom = `${site.redirect_to_www ? "" : "www."}${
    site.server_name
  }`;
  const domainRedirectTo = `${site.redirect_to_www ? "www." : ""}${
    site.server_name
  }`;

  const sslConfig = [
    `ssl_dhparam "/etc/pki/nginx/dhparams.pem";`,
    `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
    `ssl_certificate /etc/letsencrypt/live/${site.server_name}/fullchain.pem;`,
    `ssl_certificate_key /etc/letsencrypt/live/${site.server_name}/privkey.pem;`,
    `include /etc/letsencrypt/options-ssl-nginx.conf;`,
  ];
  const sslBlock = sslConfig
    .map((line) => `${ssl ? "  " : "  # "}${line}`)
    .join(`\n`);

  let config = `server {
  server_name ${site.server_name} www.${site.server_name};
  root         /usr/share/nginx/html;

  listen 80${site.default ? " default_server" : ""};
  listen [::]:80${site.default ? " default_server" : ""};

  # Redirect non-https traffic to https
  if ($scheme != "https") {
    return 301 https://$host$request_uri;
  }
}

server {
  server_name ${domainRedirectFrom};
  root         /usr/share/nginx/html;

  listen 443 ssl http2;
  listen [::]:443 ssl http2;

${sslBlock}

  return 301 https://${domainRedirectTo}$request_uri;
}

server {
  server_name ${domainRedirectTo};
  root         /usr/share/nginx/html;

  error_page   404  /404.html;
  location = /404.html {
      root   /var/www/html/errors;
  }

  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
      root   /var/www/html/errors;
  }

  listen 443 ssl http2${site.default ? " default_server" : ""};
  listen [::]:443 ssl http2${site.default ? " default_server" : ""};

${sslBlock}

  location / {
    proxy_pass http://127.0.0.1:${site.port};
    proxy_set_header        X-Real-IP       $remote_addr;
    proxy_set_header        Host            $host;
    proxy_redirect          off;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_connect_timeout 90;
    proxy_send_timeout 90;
    proxy_read_timeout 90;
    client_max_body_size 10m;
    client_body_buffer_size 128k;
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
  }
}
`;
  return config;
}

const sites = NGINX_DATA.sites;
for (let i = 0; i < sites.length; i += 1) {
  const site = sites[i];
  const nonSslConfig = generateConfig(site, false);
  const nonSslOutputPath = `system_config/nginx/sites-available/${site.server_name}`;
  fs.writeFileSync(nonSslOutputPath, nonSslConfig);
  const sslConfig = generateConfig(site, true);
  const sslOutputPath = `system_config/nginx/sites-available-ssl/${site.server_name}`;
  fs.writeFileSync(sslOutputPath, sslConfig);
  // generateConfig(site, true);
}
