const axios = require("axios");
const cheerio = require("cheerio");
let fs = require("fs");

const arg = process.argv[2];

if (arg === "-noscrape") {
  fs.readFile("genreList.json", (err, data) => {
    err
      ? Function("error", "throw error")(err)
      : console.log(data.toString("utf8"));
  });
} else if (arg === "-getlinks") {
  axios
    .get("https://www.rottentomatoes.com/top/")
    .then(response => {
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        const genreLinks = [];
        $(".genrelist li a").each((i, el) => {
          const link = `https://www.rottentomatoes.com${$(el).attr("href")}`;
          genreLinks[i] = {
            title: $(el)
              .children()
              .text(),
            link: link
          };
        });

        fs.writeFile(
          "genreList.json",
          JSON.stringify(genreLinks, null, 2),
          err => console.log("File successfully written!")
        );
      }
    })
    .catch(console.error());
} else if (arg === "-fetchdata") {
  let links;

  fs.readFile("genreList.json", (err, data) => {
    err
      ? Function("error", "throw error")(err)
      : (links = JSON.parse(data.toString("utf8")));

    const numOfLists = links.length;
    let listCounter = 0;
    const url = links[0].link;

    const getWebsiteContent = async url => {
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const results = [];

        $(".table tbody tr").each((i, el) => {
          results[i] = {
            category: links[listCounter].title,
            title: $(el)
              .find("a")
              .text()
              .replace(/\s\s+/g, "")
          };
        });

        const nextList = links[listCounter].link;
        listCounter++;

        fs.writeFile(
          `${links[listCounter - 1].title}.json`,
          JSON.stringify(results, null, 2),
          err => console.log("File successfully written!")
        );

        if (listCounter === numOfLists) {
          return false;
        }

        getWebsiteContent(nextList);
      } catch (error) {
        console.error(error);
      }
    };

    getWebsiteContent(url);
  });
}
