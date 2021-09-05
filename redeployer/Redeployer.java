///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS info.picocli:picocli:4.5.0

import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.Callable;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
// import java.nio.file.FileSystems;
// import java.nio.file.FileSystem;
// import java.nio.file.Files;
import java.nio.file.Files;

@Command(name = "Redeployer", mixinStandardHelpOptions = true, version = "Redeployer 0.1", description = "Redeployer made with jbang")
class Redeployer implements Callable<Integer> {

    private Boolean isRedeploying = false;

    public static void main(String... args) {
        new CommandLine(new Redeployer()).execute(args);
    }

    public class HelloThread extends Thread {
        private String findFirstZip() {
            File directoryPath = new File("./");
            String files[] = directoryPath.list();
            for (String fileName : files) {
                if (fileName.endsWith(".zip")) {
                    return fileName;
                }
            }
            return null;
        }

        private void systemCommand(String command) throws IOException {
            systemCommand(command, null);
        }

        private void systemCommand(String command, File workingDir) throws IOException {
            Process process = null;
            if (workingDir == null) {
                process = Runtime.getRuntime().exec(command);
            } else {
                process = Runtime.getRuntime().exec(command, new String[0], workingDir);
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }

            reader.close();
        }

        private void extractZip(String zipFile, String extractedDir) throws IOException {
            System.out.println("Creating directory for extraction " + extractedDir);
            new File("./" + extractedDir).mkdirs();

            System.out.println("Extracting zip into temporary directory");
            systemCommand("unzip " + zipFile + " -d " + extractedDir);

            System.out.println("Cleaning up zip");
            new File(zipFile).delete();
        }

        private void startPm2Process(File workingDirectory) throws IOException {
            File pm2NameFile = new File("./" + workingDirectory + "/config/aws/pm2Name");
            File startAwsFile = new File("./" + workingDirectory + "/config/aws/start_aws.sh");
            if (pm2NameFile.exists() && startAwsFile.exists()) {
                System.out.println("Creating new PM2 config");
                String pm2Name = Files.readAllLines(pm2NameFile.toPath()).get(0);

                String ecosystemContent = "module.exports = {\napps: [\n{\nname: '" + pm2Name
                        + "',\nscript: './config/aws/start_aws.sh',\nmax_memory_restart: '15M',\nwatch: ['build'],\n// Delay between restart\nwatch_delay: 1000,\nignore_watch: [],\nwatch_options: {\nfollowSymlinks: false,\n},\n},\n],\n};";
                File ecosystemFile = new File("./" + workingDirectory + "/ecosystem.config.js");
                ecosystemFile.createNewFile();
                FileWriter myWriter = new FileWriter(ecosystemFile);
                myWriter.write(ecosystemContent);
                myWriter.close();

                System.out.println("Restarting PM2 process " + pm2Name);
                systemCommand("pm2 delete " + pm2Name, workingDirectory);
                systemCommand("pm2 start ./ecosystem.config.js", workingDirectory);
                systemCommand("pm2 save");
            } else {
                System.out.println("No pm2 name provided");
            }
        }

        private void runSetup(File workingDirectory) throws IOException {
            File setupScriptFile = new File("./" + workingDirectory + "/config/aws/setup.sh");
            if (setupScriptFile.exists()) {
                System.out.println("Running setup script");
                systemCommand("./config/aws/setup.sh", workingDirectory);
            } else {
                System.out.println("No setup script to run");
            }
        }

        public void run() {
            String zipFile = findFirstZip();
            if (zipFile == null) {
                // TODO Remove this - just makes noise
                System.out.println("No file to deploy");
                return;
            }
            System.out.println("File to deploy " + zipFile);

            System.out.println("Preventing other builds");
            isRedeploying = true;
            try {
                // Sleep to ensure file transfer is complete
                Thread.sleep(10000);

                String extractedDir = zipFile.split(".zip")[0];
                String dirBaseName = zipFile.split("-")[0];

                extractZip(zipFile, extractedDir);

                File workingDirectory = new File(extractedDir);

                runSetup(workingDirectory);

                startPm2Process(workingDirectory);
            } catch (Exception e) {
                System.err.println("Something went wrong\n" + e.toString());
            }

            System.out.println("Completing deploy");
            isRedeploying = false;
        }
    }

    @Override
    public Integer call() throws Exception {
        Timer timer = new Timer();
        TimerTask tt = new TimerTask() {
            public void run() {
                if (isRedeploying) {
                    return;
                }

                (new HelloThread()).start();
            };
        };
        timer.schedule(tt, 0, 2000);
        return 0;
    }
}
