const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TIME_1_SECOND = 1000;
const TIME_5_SECONDS = 5 * 1000;
const TIME_10_SECONDS = 10 * 1000;
const TIME_20_SECONDS = 20 * 1000;
const TIME_5_MINUTES = 5 * 60 * 1000;
const TIME_30_MINUTES = 30 * 60 * 1000;

const DEV_MODE = !!process.env.DEV_MODE || false;
const DEPLOY_BLOCK_DURATION = DEV_MODE ? TIME_20_SECONDS : TIME_5_MINUTES;
const ZIP_TRANSFER_BLOCK_TIME = DEV_MODE ? TIME_1_SECOND : TIME_10_SECONDS;
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
const PM2_LOGS_PATH = DEV_MODE
  ? "/Users/george.gillams/Documents/pm2/logs"
  : "/home/ubuntu/.pm2/logs";
const CHECK_FREQUENCY = DEV_MODE ? TIME_1_SECOND : TIME_5_SECONDS;
const MAX_UNZIP_ATTEMPT_TIME = DEV_MODE ? TIME_20_SECONDS : TIME_30_MINUTES;

const ZIP_FORMAT = /[a-zA-Z0-9\.]+\-\-\-[a-zA-Z0-9\-_]+\.zip/gi;

let deploysBlockedUntil = 0;

const unzipAttemptTime = {};

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

  const sslKeyConfig = `  ssl_dhparam "/etc/pki/nginx/dhparams.pem";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  ssl_certificate /etc/letsencrypt/live/${site.server_name}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${site.server_name}/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  `;

  let config = `server {
  server_name ${site.server_name} www.${site.server_name};
  root         /usr/share/nginx/html;

  listen 80${site.is_default_site ? " default_server" : ""};
  listen [::]:80${site.is_default_site ? " default_server" : ""};

  ${
    ssl
      ? `
  # Redirect non-https traffic to https
  return 301 https://$host$request_uri;
}

server {
  server_name ${domainRedirectFrom};
  root         /usr/share/nginx/html;

  listen 443 ssl http2;
  listen [::]:443 ssl http2;

${sslKeyConfig}

  return 301 https://${domainRedirectTo}$request_uri;
}

server {
  server_name ${domainRedirectTo};
  root         /usr/share/nginx/html;

  listen 443 ssl http2${site.is_default_site ? " default_server" : ""};
  listen [::]:443 ssl http2${site.is_default_site ? " default_server" : ""};

${sslKeyConfig}
  `
      : ``
  }

  error_page   404  /404.html;
  location = /404.html {
      root   /var/www/html/errors;
  }

  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
      root   /var/www/html/errors;
  }

  location / {
    proxy_pass http://127.0.0.1:${site.host_port};
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
    execSync("sudo service nginx restart");
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
    `sudo certbot certonly --nginx -d ${serverName} -d www.${serverName} --debug`
  );
};

const cleanup = (filePath, extractionPath) => {
  for (let path of [filePath, extractionPath]) {
    if (path && pathsExistsSimple(path)) {
      fs.rmSync(path, { force: true, recursive: true });
    }
  }
};

const extractZip = (filePath, extractionPath, fileNameWOExt) => {
  if (pathsExistsSimple(extractionPath)) {
    throw new Error(
      `Extraction location ${fileNameWOExt} is already in use. To redeploy, send a file with a unique hash.`
    );
  }
  execSync(`mkdir -p ${extractionPath}`);
  execSync(`unzip -o ${filePath} -d ${extractionPath}`);
  execSync(`rm -rf ${filePath}`);
};

const checkKeysExist = (meta, expectedKeys, fileNameWOExt) => {
  const metaKeys = Object.keys(meta);
  for (let expectedKey of expectedKeys) {
    if (!metaKeys.includes(expectedKey)) {
      throw new Error(
        `Cannot deploy app ${fileNameWOExt} as meta data ${expectedKey} is not defined`
      );
    }
  }
};

const readMetaFile = (metaPath, fileNameWOExt) => {
  if (!pathsExistsSimple(metaPath)) {
    throw new Error(
      `Cannot deploy app ${fileNameWOExt} as meta.json file is missing`
    );
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  checkKeysExist(meta, ["is_webapp"], fileNameWOExt);
  const expectedKeys = ["is_webapp", "docker_port", "server_name"];
  if (meta.is_webapp) {
    expectedKeys.push("redirect_to_www");
  }
  checkKeysExist(meta, expectedKeys, fileNameWOExt);

  return meta;
};

const sslAlreadyConfigured = (serverName) => {
  return pathsExistsSimple(path.join(SSL_KEY_PATH, serverName, "privkey.pem"));
};

const generatePm2Config = (outputPath, dockerImage, dockerContainerId) => {
  const text = `module.exports = {
  apps: [
    {
      name: '${dockerImage}',
      script: 'docker start ${dockerContainerId}',
      restart_delay: 10000,
    },
  ],
};`;
  fs.writeFileSync(outputPath, text);
};

const getDockerImages = () => {
  const dockerImagesJson = execSync(
    "curl --unix-socket /var/run/docker.sock http://localhost/v1.24/images/json?all=1"
  );

  const dockerImageData = JSON.parse(dockerImagesJson);
  return dockerImageData;
};
const getDockerContainers = () => {
  const dockerContainersJson = execSync(
    "curl --unix-socket /var/run/docker.sock http://localhost/v1.24/containers/json?all=1"
  );

  const dockerContainerData = JSON.parse(dockerContainersJson);
  return dockerContainerData;
};
const getPm2Processes = () => {
  const pm2JsonListOutput = execSync(`pm2 jlist`).toString().split("\n");
  const pm2JsonList = pm2JsonListOutput[pm2JsonListOutput.length - 1];
  const pm2Data = JSON.parse(pm2JsonList);
  return pm2Data;
};

const getOldAppItems = (list, appName, newHash) => {
  return list.filter(
    (name) =>
      name.startsWith(`${appName}---`) && !name.includes(`---${newHash}`)
  );
};

const getMatchingDockerImage = (appName, hash) => {
  return getDockerImages().find(
    (entry) => entry.RepoTags[0].split(":latest")[0] === `${appName}---${hash}`
  );
};
const getOldDockerImages = (appName, newHash) => {
  const dockerImageNames = getDockerImages().map(
    (entry) => entry.RepoTags[0].split(":latest")[0]
  );
  return getOldAppItems(dockerImageNames, appName, newHash);
};
const getOldDockerContainers = (appName, newHash) => {
  const dockerContainerEntries = getDockerContainers().filter(
    (entry) =>
      entry.Image.startsWith(`${appName}---`) &&
      !entry.Image.endsWith(`---${newHash}`)
  );
  return dockerContainerEntries.map((entry) => entry.Id);
};
const getOldDeployDirectories = (appName, newHash) => {
  const fileList = execSync(`ls ${DEPARTURE_LOUNGE_LOCATION}`)
    .toString()
    .split("\n");
  return getOldAppItems(fileList, appName, newHash);
};
const getOldPm2Processes = (appName, newHash) => {
  const pm2List = getPm2Processes().map((entry) => entry.name);
  return getOldAppItems(pm2List, appName, newHash);
};

const getOldPm2Logs = (appName, newHash) => {
  const pm2Logs = execSync(`ls ${PM2_LOGS_PATH}`).toString().split("\n");
  return getOldAppItems(pm2Logs, appName, newHash);
};

const getPortsInUse = () => {
  const ports = execSync("sudo lsof -nP -iTCP -sTCP:LISTEN")
    .toString()
    .split("\n")
    .map((l) => {
      if (l.includes("*:")) {
        const port = l.split("*:")[1].split(" ")[0];
        return parseInt(port);
      }
      return null;
    })
    .filter((l) => !!l);
  return ports;
};

const findUnusedPort = () => {
  const ports = getPortsInUse();
  for (let possiblePort = 3000; possiblePort < 3999; possiblePort++) {
    if (!ports.includes(possiblePort)) {
      return possiblePort;
    }
  }
  return null;
};

const portInUse = (port) => {
  const ports = getPortsInUse();
  return ports.includes(port);
};

const destroyOldProcesses = (
  oldPm2Processes,
  oldDockerContainers,
  oldDockerImages
) => {
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
};

const configureNewProcesses = (meta) => {
  console.log(`Configuring new process for ${meta.server_name}`);
  // Generate/Update nginx config
  if (meta.is_webapp) {
    let sslConfigured = sslAlreadyConfigured(meta.server_name);
    if (!sslConfigured) {
      generateNginxConfig(meta, sslConfigured);
      try {
        configureSSL(meta.server_name);
        sslConfigured = true;
      } catch (error) {
        console.log(
          `Error configuring SSL. This should be done manually and the project redeployed.`
        );
      }
    }
    generateNginxConfig(meta, sslConfigured);
  }
};

const createNewProcesses = (meta, fileNameWOExt, pm2ConfigPath) => {
  console.log(`Creating new processes for ${fileNameWOExt}`);
  // add new docker image
  const dockerContainerId = execSync(
    `docker create -t -p ${meta.host_port}:${meta.docker_port} ${fileNameWOExt}`
  )
    .toString()
    .split("\n")[0];

  generatePm2Config(pm2ConfigPath, fileNameWOExt, dockerContainerId);

  // Run with PM2
  execSync(`pm2 start ${pm2ConfigPath}`);
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

    try {
      extractZip(filePath, extractionPath, fileNameWOExt);
    } catch (error) {
      if (
        error
          .toString()
          .includes("End-of-central-directory signature not found.")
      ) {
        if (unzipAttemptTime[fileNameWOExt] > MAX_UNZIP_ATTEMPT_TIME) {
          throw new Error(
            `Zip file has repeatedly failed. Removing incomplete file.`
          );
        }
        console.log(`Zip file is not yet fully uploaded.`);
        cleanup(extractionPath);
        deploysBlockedUntil = Date.now() + ZIP_TRANSFER_BLOCK_TIME;
        unzipAttemptTime[fileNameWOExt] =
          (unzipAttemptTime[fileNameWOExt] || 0) + ZIP_TRANSFER_BLOCK_TIME;
        return;
      } else {
        throw error;
      }
    }

    const meta = readMetaFile(metaPath, fileNameWOExt);
    console.table(meta);
    if (meta["host_port"] && portInUse(meta["host_port"])) {
      meta["host_port_in_use"] = true;
    }
    meta["host_port"] = meta["host_port"] || findUnusedPort();
    console.log(`Current deploy will use port:`, meta["host_port"]);
    console.log(`Port is ${meta["host_port_in_use"] ? "" : "not "}in use`);

    const duplicateImage = getMatchingDockerImage(appName, hash);
    if (duplicateImage) {
      throw new Error(
        `An image for app ${appName} with hash ${hash} is already loaded in Docker. To redeploy, send an image with a unique hash.`
      );
    }

    // Load to docker
    console.log(`Loading docker image`);
    execSync(`docker load < ${dockerImagePath}`);
    console.log(`Docker image loaded`);

    const oldDockerImages = getOldDockerImages(appName, hash);
    const oldDockerContainers = getOldDockerContainers(appName, hash);
    const oldDeployDirectories = getOldDeployDirectories(appName, hash);
    const oldPm2Processes = getOldPm2Processes(appName, hash);
    const oldPm2Logs = getOldPm2Logs(appName, hash);
    console.log(`oldDockerImages`, oldDockerImages);
    console.table({
      oldDockerImages,
      oldDockerContainers,
      oldDeployDirectories,
      oldPm2Processes,
      oldPm2Logs,
    });

    // if port is in use we need to destroy it first. If using a fresh port, we can create the new processes first and then destroy the old ones.
    if (meta["host_port_in_use"]) {
      destroyOldProcesses(
        oldPm2Processes,
        oldDockerContainers,
        oldDockerImages
      );
      configureNewProcesses(meta);
      createNewProcesses(meta, fileNameWOExt, pm2ConfigPath);
    } else {
      createNewProcesses(meta, fileNameWOExt, pm2ConfigPath);
      configureNewProcesses(meta);
      destroyOldProcesses(
        oldPm2Processes,
        oldDockerContainers,
        oldDockerImages
      );
    }

    // PM2 save
    execSync(`pm2 save --force`);

    // Delete old version files
    oldDeployDirectories.forEach((directory) => {
      execSync(`rm -rf ${path.join(DEPARTURE_LOUNGE_LOCATION, directory)}`);
    });

    // Delete old pm2 logs
    oldPm2Logs.forEach((oldLog) => {
      console.log(`Removing old log ${oldLog}`);
      execSync(`rm -f ${path.join(PM2_LOGS_PATH, oldLog)}`);
    });

    // Delete new docker-image file. It is not needed having already been loaded into docker
    execSync(`rm -f ${dockerImagePath}`);
  } catch (error) {
    console.error(`Error deploying: ${error}`);
    delete unzipAttemptTime[fileNameWOExt];
    cleanup(filePath, extractionPath);
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
