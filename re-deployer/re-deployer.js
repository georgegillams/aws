const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TIME_20_SECONDS = 20 * 1000;
const TIME_20_MINUTES = 20 * 60 * 1000;
const TIME_1_SECOND = 1000;
const TIME_5_SECONDS = 5 * 1000;
const TIME_10_SECONDS = 10 * 1000;

const DEV_MODE = !!process.env.DEV_MODE || false;
const DEPLOY_BLOCK_DURATION = DEV_MODE ? TIME_20_SECONDS : TIME_20_MINUTES;
const ZIP_TRANSFER_BLOCK_TIME = TIME_10_SECONDS;
const DEPARTURE_LOUNGE_LOCATION = DEV_MODE
  ? "/Users/george.gillams/Documents/departure-lounge"
  : "/home/ubuntu/departure-lounge";
const NGINX_SITES_AVAILABLE_LOCATION = DEV_MODE
  ? "/Users/george.gillams/Documents/nginx/sites-available"
  : "/etc/nginx/sites-available";
const NGINX_SITES_ENABLED_LOCATION = DEV_MODE
  ? "/Users/george.gillams/Documents/nginx/sites-enabled"
  : "/etc/nginx/sites-enabled";
const SSL_KEY_PATH = DEV_MODE
  ? "/Users/george.gillams/Documents/letsencrypt/live"
  : "/etc/letsencrypt/live";
const CHECK_FREQUENCY = DEV_MODE ? TIME_1_SECOND : TIME_5_SECONDS;

const ZIP_FORMAT = /[a-zA-Z0-9\.]+\-\-\-[a-zA-Z0-9]+\.zip/gi;

let deploysBlockedUntil = 0;

const calculatePaths = (fileName) => {
  let fileNameWOExt = fileName.endsWith(".zip")
    ? fileName.slice(0, fileName.length - 4)
    : fileName;
  const filePath = path.join(DEPARTURE_LOUNGE_LOCATION, fileName);
  const extractionPath = path.join(DEPARTURE_LOUNGE_LOCATION, fileNameWOExt);
  const pm2ConfigPath = path.join(extractionPath, "ecosystem.config.js");
  return {
    fileName,
    fileNameWOExt,
    filePath,
    extractionPath,
    pm2ConfigPath,
    metaPath: path.join(extractionPath, `meta.json`),
    dockerImagePath: path.join(extractionPath, `docker-image.tar`),
  };
};

function getNginxConfigText(site, ssl) {
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

  listen 80${site.is_default_site ? " default_server" : ""};
  listen [::]:80${site.is_default_site ? " default_server" : ""};

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

  listen 443 ssl http2${site.is_default_site ? " default_server" : ""};
  listen [::]:443 ssl http2${site.is_default_site ? " default_server" : ""};

${sslBlock}

  location / {
    proxy_pass http://127.0.0.1:${site.server_port};
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

const generateNginxConfig = (site, withSsl) => {
  const text = getNginxConfigText(site, withSsl);
  const outputPath = path.join(
    NGINX_SITES_AVAILABLE_LOCATION,
    site.server_name
  );
  fs.writeFileSync(outputPath, text);
  execSync(`ln -s ${outputPath} ${NGINX_SITES_ENABLED_LOCATION}/ || true`);
  if (!DEV_MODE) {
    execSync("service nginx restart");
  }
};

const pathsExistsSimple = (pathToTest) => {
  return fs.existsSync(path.relative("", pathToTest));
};

const configureSSL = (serverName) => {
  if (DEV_MODE) {
    // Mock SSL configuration
    fs.mkdirSync(path.join(SSL_KEY_PATH, serverName), {
      recursive: true,
      force: true,
    });
    fs.writeFileSync(path.join(SSL_KEY_PATH, serverName, "privkey.pem"), "");
    return;
  }
  execSync(
    `/usr/bin/certbot-auto certonly --nginx -d ${serverName} -d www.${serverName} --debug`
  );
};

const abortDeploy = (filePath, extractionPath) => {
  for (let path of [filePath, extractionPath]) {
    if (pathsExistsSimple(path)) {
      fs.rmSync(path, { force: true, recursive: true });
    }
  }
};

const extractZip = (filePath, extractionPath) => {
  execSync(`unzip -o ${filePath} -d ${DEPARTURE_LOUNGE_LOCATION}`);
  execSync(`rm -rf ${filePath}`);
};

const readMetaFile = (metaPath, fileNameWOExt) => {
  if (!pathsExistsSimple(metaPath)) {
    throw new Error(
      `Cannot deploy app ${fileNameWOExt} as meta.json file is missing`
    );
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const metaKeys = Object.keys(meta);
  for (let expectedKey of ["server_port", "server_name", "redirect_to_www"]) {
    if (!metaKeys.includes(expectedKey)) {
      throw new Error(
        `Cannot deploy app ${fileNameWOExt} as meta data ${expectedKey} is not defined`
      );
    }
  }

  return meta;
};

const sslAlreadyConfigured = (serverName) => {
  return pathsExistsSimple(path.join(SSL_KEY_PATH, serverName, "privkey.pem"));
};

const generatePm2Config = (outputPath, site, dockerImage) => {
  const text = `module.exports = {
  apps: [
    {
      name: '${dockerImage}',
      script: 'docker run -t -p ${site.server_port}:3000 ${dockerImage}',
    },
  ],
};`;
  fs.writeFileSync(outputPath, text);
};

const getOldAppItems = (list, appName, newHash) => {
  return list.filter(
    (name) =>
      name.startsWith(`${appName}---`) && !name.endsWith(`---${newHash}`)
  );
};

const getOldDockerImages = (appName, newHash) => {
  const dockerImageEntries = execSync("docker image list --all")
    .toString()
    .split("\n")
    .filter(
      (entry) =>
        entry.includes(`${appName}---`) &&
        !entry.includes(`${appName}---${newHash}`)
    );
  return dockerImageEntries.map((entry) => entry.split(" ")[0]);
};
const getOldDockerContainers = (appName, newHash) => {
  const dockerContainerEntries = execSync("docker container list --all")
    .toString()
    .split("\n")
    .filter(
      (entry) =>
        entry.includes(`${appName}---`) &&
        !entry.includes(`${appName}---${newHash}`)
    );
  return dockerContainerEntries.map((entry) => entry.split(" ")[0]);
};
const getOldDeployDirectories = (appName, newHash) => {
  const fileList = execSync(`ls ${DEPARTURE_LOUNGE_LOCATION}`)
    .toString()
    .split("\n");
  return getOldAppItems(fileList, appName, newHash);
};
const getOldPm2Processes = (appName, newHash) => {
  const pm2List = JSON.parse(execSync(`pm2 jlist`).toString()).map(
    (entry) => entry.name
  );
  return getOldAppItems(pm2List, appName, newHash);
};

const deploy = (fileName) => {
  const {
    fileNameWOExt,
    filePath,
    extractionPath,
    pm2ConfigPath,
    metaPath,
    dockerImagePath,
  } = calculatePaths(fileName);

  try {
    const [appName, hash] = fileNameWOExt.split("---");

    console.table({
      fileNameWOExt,
      filePath,
      extractionPath,
      pm2ConfigPath,
      metaPath,
      dockerImagePath,
      appName,
      hash,
    });

    extractZip(filePath, extractionPath);

    const meta = readMetaFile(metaPath);
    console.table(meta);

    let sslConfigured = sslAlreadyConfigured(meta.server_name);
    if (!sslConfigured) {
      generateNginxConfig(meta, sslConfigured);
      configureSSL(meta.server_name);
      sslConfigured = true;
    }
    generateNginxConfig(meta, sslConfigured);

    generatePm2Config(pm2ConfigPath, meta, fileNameWOExt);
    // Load to docker
    execSync(`docker load < ${path.join(extractionPath, "docker-image.tar")}`);

    const oldDockerImages = getOldDockerImages(appName, hash);
    const oldDockerContainers = getOldDockerContainers(appName, hash);
    const oldDeployDirectories = getOldDeployDirectories(appName, hash);
    const oldPm2Processes = getOldPm2Processes(appName, hash);
    console.log(`oldDockerImages`, oldDockerImages);
    console.table({
      oldDockerImages,
      oldDockerContainers,
      oldDeployDirectories,
      oldPm2Processes,
    });

    // Kill PM2 if needed
    oldPm2Processes.forEach((pm2Processes) => {
      execSync(`pm2 delete ${pm2Processes}`);
    });
    // Kill old docker containers if needed
    oldDockerContainers.forEach((dockerContainer) => {
      execSync(`docker rm --force ${dockerContainer}`);
    });
    // Delete old docker images if needed
    oldDockerImages.forEach((dockerImage) => {
      execSync(`docker image rm --force ${dockerImage}`);
    });

    // Run with PM2
    execSync(`pm2 start ${pm2ConfigPath}`);
    // PM2 save
    execSync(`pm2 save --force`);

    // Delete old version files
    oldDeployDirectories.forEach((directory) => {
      execSync(`rm -rf ${path.join(DEPARTURE_LOUNGE_LOCATION, directory)}`);
    });
  } catch (error) {
    if (
      error.toString().includes("End-of-central-directory signature not found.")
    ) {
      console.log(`Zip file is not yet fully uploaded.`);
      deploysBlockedUntil = Date.now() + ZIP_TRANSFER_BLOCK_TIME;
      return;
    }

    console.error(`Error deploying: ${error}`);
    abortDeploy(filePath, extractionPath);
  }
};

const getNewFileToDeploy = () => {
  const fileList = execSync(`ls ${DEPARTURE_LOUNGE_LOCATION}`)
    .toString()
    .split("\n");
  const deployableZips = fileList.filter((f) => ZIP_FORMAT.test(f));
  console.table({ fileList, deployableZips });
  if (deployableZips.length > 0) {
    return deployableZips[0];
  }
  return null;
};

const checkForNewDeploy = () => {
  if (Date.now() < deploysBlockedUntil) {
    console.log(`Waiting for current task to complete`);
    return;
  }

  const newFileNameToDeploy = getNewFileToDeploy();
  if (!newFileNameToDeploy) {
    console.log(`No file to deploy`);
    return;
  }

  deploysBlockedUntil = Date.now() + DEPLOY_BLOCK_DURATION;
  deploy(newFileNameToDeploy);
};

setInterval(checkForNewDeploy, CHECK_FREQUENCY);
