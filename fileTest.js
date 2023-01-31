const fs = require("fs");

// fs.writeFile("mynewfile3.txt", "Hello content!", function (err) {
//   if (err) throw err;
//   console.log("Saved!");
// });

fs.unlink("mynewfile3.txt", (err) => {
  if (err) {
    throw err;
  }
  console.log("Delete File successfully.");
});
