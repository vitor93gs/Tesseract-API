const express = require("express");
const app = express();
const port = 4500;
const { exec } = require("child_process");
const Tesseract = require("tesseract.js");
const bodyParser = require("body-parser");
const fs = require("fs");

var response = {
  type: "",
  atd: "",
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(bodyParser.raw({ type: "application/octet-stream", limit: "50mb" }));

app.post("/getInfo", async (req, res) => {
  response = {
    type: "",
    atd: "",
  };
  const fileBuffer = req.body;
  const records = JSON.parse(req.headers.recordarray).record;
  try {
    const localFilePath = "input.pdf";
    fs.writeFile(localFilePath, fileBuffer, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      exec(
        `gm convert -density 300 ${localFilePath} output.png`,
        async (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }

          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);

          console.log("Page 1 is now converted as image");
          const worker = await Tesseract.createWorker({
            logger: (m) => console.log(m),
          });

          await worker.loadLanguage("por");
          await worker.initialize("por");
          // Read the image file and convert it to a Uint8Array
          const imageBuffer = await fs.readFileSync("output.png");
          const imageUint8Array = new Uint8Array(imageBuffer);
          const {
            data: { text },
          } = await worker.recognize(imageUint8Array);

          // verificação de atendimento
          let match = text.match(/Atend\.: (\d+)/);
          let match2 = text.match(/Atendimento — (\d+)/);
          let match3 = text.match(/Atendimento (\d+)\.(\d+)/);

          if (match) {
            console.log("entrou no primeiro match");
            response.atd = match[1];
          } else if (match2) {
            console.log("entrou no segundo match");
            response.atd = match2[1];
          } else if (match3) {
            console.log("entrou no terceiro match");
            response.atd = match3[1] + match3[2];
          } else {
            console.log("Número de atendimento não encontrado.");
          }

          // verificaçao de tipo de documento

          for (const element of records) {
            if (text.includes(element.integration_starts_with)) {
              response.type = element.integration_starts_with;
            }
          }

          await worker.terminate();

          fs.unlinkSync("output.png");
          fs.unlinkSync("input.pdf");
          console.log(response);
          return res.status(200).json(response);
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
