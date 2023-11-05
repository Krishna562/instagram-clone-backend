import fs from "fs";
import path from "path";

export const deleteFile = (postImg) => {
  const pathToImagesDir = path.resolve(path.join(".", "images"));
  fs.readdir(pathToImagesDir, (err, files) => {
    if (err) console.log(err);
    else {
      const filename = files.find((file) => {
        return postImg.includes(file);
      });
      fs.unlink(`${pathToImagesDir}/${filename}`, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });
};
