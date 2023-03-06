"use strict";

const mql = require("@microlink/mql");
const axios = require("axios");
const puppeteer = require("puppeteer");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const getColors = require("get-image-colors");
const sanitizeHtml = require("sanitize-html");
const { additional_field } = require("../../../../constant");
const { parse } = require('tldts');
const { openai } = require("../../../../utils");

/**
 * domain-details service
 */

module.exports = () => ({
  getDomainDetails: async (url, origin) => {

    let originURL = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    let urldata;
    let githubURL;
    let linkURL;
    let trafficURL;
    let sociallinkURL;
    let categoryURL;
    let excerptsURL;
    let textURL;
    let htmlURL;
    let spotifyURL;
    let soundcloudURL;
    let redditURL;
    let producthuntURL;
    let imdbURL;
    let amazonURL;
    let instagramURL;
    let tiktokURL;
    let youtubeURL;
    let emailURL;
    let phonenumberURL;
    let twitterURL;
    let technologystackURL;
    let fullscreenshotURL;
    let screenshotURL;
    let healthcheckURL;
    let iframeURL;
    let brandcolorURL;
    let digitalrankURL;

    url.map(async (data) => {

      if (data.field === "url") {
        if (data.value.endsWith("/")) {
          data.value = data.value.slice(0, -1);
        }
        urldata = data.value;
        githubURL = data.value;
        instagramURL = data.value;
        spotifyURL = data.value;
        soundcloudURL = data.value;
        redditURL = data.value;
        producthuntURL = data.value;
        imdbURL = data.value;
        amazonURL = data.value;
        tiktokURL = data.value;
        youtubeURL = data.value;
        twitterURL = data.value;

      }

      if (data.field === "email" && data.value === "true") {
        emailURL = data.value;
      }
      if (data.field === "phonenumber" && data.value === "true") {
        phonenumberURL = data.value;
      }
      if (data.field === "brandcolor" && data.value === "true") {
        brandcolorURL = data.value;
      }
      if (data.field === "html" && data.value === "true") {
        htmlURL = data.value;
      }
      if (data.field === "links" && data.value === "true") {
        linkURL = data.value;
      }
      if (data.field === "traffic" && data.value === "true") {
        trafficURL = data.value;
      }
      if (data.field === "sociallink" && data.value === "true") {
        sociallinkURL = data.value;
      }
      if (data.field === "category" && data.value === "true") {
        categoryURL = data.value;
      }
      if (data.field === "excerpts" && data.value === "true") {
        excerptsURL = data.value;
      }
      if (data.field === "text" && data.value === "true") {
        textURL = data.value;
      }
      if (data.field === "technologystack" && data.value === "true") {
        technologystackURL = data.value;
      }
      if (data.field === "fullscreenshot" && data.value === "true") {
        fullscreenshotURL = data.value;
      }
      if (data.field === "screenshot" && data.value === "true") {
        screenshotURL = data.value;
      }
      if (data.field === "healthcheck" && data.value === "true") {
        healthcheckURL = data.value;
      }
      if (data.field === "iframe" && data.value === "true") {
        iframeURL = data.value;
      }
      if (data.field === "digitalrank" && data.value === "true") {
        digitalrankURL = data.value;
      }
      if (data.field === "logo" && data.value === "true") {
        logoURL = data.value;
      }
    });

    // linkData
    let realLinks = []
    if (linkURL) {
      const browser = await puppeteer.launch({
        headless: true,
      });
      const page = (await browser.pages())[0];
      await page.goto(urldata);
      const hrefs = await page.$$eval("a", (as) => as.map((a) => a.href));

      hrefs.filter(test => {
        if (test.startsWith("https://")) {
          realLinks.push(test)
        }
      })
      await browser.close();
    }

    // email and phonenumber array
    // webcontactData
    let emailsArr = [];
    let phoneNumArr = [];
    if (emailURL || phonenumberURL) {
      const webcontact = await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://website-contacts.whoisxmlapi.com/api/v1?apiKey=${process.env.WEB_CONTACT_KEY}&domainName=${urldata}&outputFormat=json`
      });
      let webcontactData = {
        emails: webcontact.data.emails,
        phones: webcontact.data.phones,
      };

      webcontactData.emails.map((data) => {
        emailsArr.push(data.email);
      });
      webcontactData.phones.map((data) => {
        phoneNumArr.push(data);
      });

      // emailData
      const emailData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        meta: false,
        data: {
          emails: {
            selector: "body",
            type: "email",
          },
        },
      });

      if (emailData.data.emails === null) {
        emailsArr;
      } else {
        emailData.data.emails.map((data) => {
          emailsArr.push(data);
        });
      }
    }

    // githubData
    let githubRes;
    if (githubURL.startsWith(additional_field.github)) {
      const githubData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          stats: {
            selector: ".application-main",
            attr: {
              followers: {
                selector:
                  '.js-profile-editable-area a[href*="tab=followers"] span',
                type: "number",
              },
              following: {
                selector:
                  '.js-profile-editable-area a[href*="tab=following"] span',
                type: "number",
              },
              stars: {
                selector:
                  '.js-responsive-underlinenav a[data-tab-item="stars"] span',
                type: "number",
              },
            },
          },
        },
      });
      githubRes = githubData;
    }

    //spotifyData
    let spotifyRes;
    if (spotifyURL.startsWith(additional_field.spotify)) {
      const spotifyData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        audio: true,
      });
      spotifyRes = spotifyData;
    }

    // soundcloudData
    let soundcloudRes;
    if (soundcloudURL.startsWith(additional_field.soundcloud)) {
      const soundcloudData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        prerender: true,
        audio: true,
        data: {
          plays: {
            selector: ".sc-ministats-plays .sc-visuallyhidden",
            type: "number",
          },
        },
      });
      soundcloudRes = soundcloudData;
    }

    // redditData
    let redditRes;
    if (redditURL.startsWith(additional_field.reddit)) {
      const redditData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          karma: {
            selector: "#profile--id-card--highlight-tooltip--karma",
          },
          birthday: {
            selector: "#profile--id-card--highlight-tooltip--cakeday",
          },
          avatar: {
            selector: 'img[alt="User avatar"]',
            attr: "src",
            type: "url",
          },
        },
      });
      redditRes = redditData;
    }

    // producthuntData
    let producthuntRes;
    if (producthuntURL.startsWith(additional_field.producthunt)) {
      const producthuntData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          reviews: {
            selector: 'div div div div div div a[href$="reviews"]',
          },
        },
      });
      producthuntRes = producthuntData;
    }

    // imdbData
    let imdbRes;
    if (imdbURL.startsWith(additional_field.imdb)) {
      const imdbData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          director: {
            selector: ".ipc-metadata-list__item:nth-child(1) a",
            type: "text",
          },
          writer: {
            selector: ".ipc-metadata-list__item:nth-child(2) a",
            type: "text",
          },
          duration: {
            selector:
              '.ipc-inline-list__item[role="presentation"]:nth-child(3)',
            type: "text",
          },
          year: {
            selector:
              '.ipc-inline-list__item[role="presentation"]:nth-child(1) span',
            type: "number",
          },
          rating: {
            selector: ".rating-bar__base-button .ipc-button__text span",
            type: "text",
          },
          ratingCount: {
            selector:
              ".rating-bar__base-button .ipc-button__text div:nth-child(3)",
            type: "text",
          },
        },
      });
      imdbRes = imdbData;
    }

    // amazonData
    let amazonRes;
    if (amazonURL.startsWith(additional_field.amazon)) {
      const amazonData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          price: {
            selector: "#attach-base-product-price",
            attr: "val",
            type: "number",
          },
          currency: {
            selector: "#featurebullets_feature_div",
            attr: "val",
          },
        },
      });
      amazonRes = amazonData;
    }

    // instagramData
    let instagramRes;
    if (instagramURL.startsWith(additional_field.instagram)) {
      const instagramData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          avatar: {
            selector: 'meta[property="og:image"]',
            attr: "content",
            type: "image",
          },
          stats: {
            selector: 'meta[property="og:description"]',
            attr: "content",
          },
        },
      });
      instagramRes = instagramData;
    }

    //tiktokData
    let tiktokRes;
    if (tiktokURL.startsWith(additional_field.tiktok)) {
      const tiktokData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          song: {
            selector: 'h4[data-e2e="browse-music"]',
            attr: "text",
            type: "string",
          },
          likeCount: {
            selector: 'strong[data-e2e="like-count"]',
            attr: "text",
            type: "string",
          },
          commentCount: {
            selector: 'strong[data-e2e="comment-count"]',
            attr: "text",
            type: "string",
          },
          shareCount: {
            selector: 'strong[data-e2e="share-count"]',
            attr: "text",
            type: "string",
          },
        },
      });
      tiktokRes = tiktokData;
    }

    // youtubeData
    let youtubeRes;
    if (youtubeURL.startsWith(additional_field.youtube)) {
      const youtubeData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        prerender: true,
        video: true,
        audio: true,
        data: {
          views: {
            selector: ".view-count",
            type: "number",
          },
        },
      });
      youtubeRes = youtubeData;
    }

    // twitterData
    let twitterRes;
    if (twitterURL.startsWith(additional_field.twitter)) {
      const twitterData = await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        data: {
          banner: {
            selector: 'main a[href$="header_photo"] img',
            attr: "src",
            type: "image",
          },
          stats: {
            selector: "main",
            attr: {
              tweets: {
                selector: "div > div > div > div h2 + div",
              },
              followings: {
                selector: 'a[href*="following"] span span',
              },
              followers: {
                selector: 'a[href*="followers"] span span',
              },
            },
          },
          latestTweets: {
            selectorAll: "main article",
            attr: {
              content: {
                selector: "div[lang]",
                attr: "text",
              },
              link: {
                selector: "a",
                attr: "href",
              },
            },
          },
        },
        prerender: true,
        waitForSelector: "main article",
      });
      twitterRes = twitterData;
    }

    let digitalRes;
    let domain = parse(urldata);;
    if (digitalrankURL) {
      const digitalRankData = await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://api.similarweb.com/v1/similar-rank/${domain.domain}/rank?api_key=${process.env.SIMILAR_RANK_API_KEY}`
      });
      digitalRes = digitalRankData;
    }

    const healthcheckData = async ({ query, page, response }) => ({
      url: response && response.url(),
      statusCode: response && response.status(),
    });

    const code = async ({ url, html }) => {
      const { Readability } = require("@mozilla/readability");
      const { JSDOM, VirtualConsole } = require("jsdom");
      const dom = new JSDOM(html, {
        url,
        virtualConsole: new VirtualConsole(),
      });
      const reader = new Readability(dom.window.document);
      return reader.parse().excerpt;
    };
    const excerpts = (url, props) => {
      return mql(url, {
        function: code.toString(),
        meta: false,
        ...props,
      }).then(({ data }) => data.function);
    }

    let [iframely, html, traffic, excerpt, sociallink, category, iframe, healthcheck, screenshot, fullscreenshot, technologystack] = await Promise.allSettled([

      // iframely
      await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://iframe.ly/api/iframely?url=${originURL}/&api_key=${process.env.IFRAMELY_API_KEY}&iframe=1&omit_script=1`
      }),
      // html
      await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        meta: false,
        data: {
          html: {
            selector: "html",
          },
        },
      }),
      // traffic
      trafficURL ? await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://api.hexomatic.com/v2/app/services/v1/workflows/${process.env.WORKFLOW_ID}?key=${process.env.TRAFFIC_API_KEY}`
      }) : null,
      // excerpts
      excerptsURL ? await excerpts(urldata) : null,
      // sociallink
      sociallinkURL ? await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://website-contacts.whoisxmlapi.com/api/v1?apiKey=${process.env.WEB_CONTACT_KEY}&domainName=${urldata}`
      }) : null,
      // category
      categoryURL ? await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://website-categorization.whoisxmlapi.com/api/v2?apiKey=${process.env.WEB_CONTACT_KEY}&domainName=${urldata}`
      }) : null,
      // embed
      iframeURL ? await axios({
        method: "get",
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'identity'
        },
        url: `https://iframe.ly/api/oembed?url=${urldata}/&api_key=${process.env.IFRAMELY_API_KEY}&iframe=1&omit_script=1`
      }) : null,
      // healthcheck
      healthcheckURL ? await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        function: healthcheckData.toString(),
        meta: false,
      }) : null,
      // screenshot
      screenshotURL || brandcolorURL ? await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        meta: false,
        screenshot: true,
      }) : null,
      // fullscreenshot
      fullscreenshotURL ? await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        meta: false,
        screenshot: true,
        fullpage: true,
      }) : null,
      // technologystack
      technologystackURL ? await mql(urldata, {
        apiKey: process.env.MICROLINK_API_KEY,
        meta: false,
        insights: {
          lighthouse: false,
          technologies: true,
        },
      }) : null,
    ]);

    // category
    let categoryArr = [];
    let uniqueCategoty;
    if (categoryURL) {

      category.value.data.categories.map((data) => {
        if (data.tier1 === null) {
          categoryArr;
        } else {
          categoryArr.push(data.tier1.name);
        }
        if (data.tier2 === null) {
          categoryArr;
        } else {
          categoryArr.push(data.tier2.name);
        }
      });
      uniqueCategoty = [...new Set(categoryArr)];
    }

    // text
    let article;
    const htmldata = sanitizeHtml(html.value.data.html);
    const doc = new JSDOM(htmldata, { url: urldata });
    let reader = new Readability(doc.window.document);
    article = reader.parse();

    // landing page color
    let col = [];
    let logoCol = [];
    let uniqueColor;
    let uniqueLogoCol;
    if (brandcolorURL) {
      const colors = await getColors(screenshot.value.data.screenshot.url);
      for (let i = 0; i < colors.length; i++) {
        colors.forEach((color) => {
          col.push(color.hex());
        });
      }
      uniqueColor = [...new Set(col)]


      // logo color
      const { data } = await mql(urldata);

      if (data.logo === null || data.logo === undefined) {
        logoCol = null;
      } else if (data.logo.type === "ico") {
        logoCol = null;
      } else {
        const logoColor = await getColors(data.logo.url);
        for (let i = 0; i < logoColor.length; i++) {
          logoColor.forEach((color) => {
            logoCol.push(color.hex());
          });
        }
      }
      uniqueLogoCol = [...new Set(logoCol)];
    }

    // tags
    const promptsData = await strapi.entityService.findMany('api::internal-ai-prompt.internal-ai-prompt', {
      filters: { promptType: 'Explain Site & Get Keywords' }
    });

    const words = promptsData[0].inputWords;

    const textForOpenai = article.textContent.split(/\s+/).slice(0, words).join(" ");

    const prompt = promptsData[0].prompt.replace(/{domain}/g, domain.domain).replace(/{text}/g, textForOpenai);

    const openaiData = await openai(prompt);
    const openaiRes = openaiData.endsWith('.') ? openaiData.slice(0, -1) : openaiData;

    const summary = openaiRes.split('Keywords:')[0];
    const keywords = openaiRes.split('Keywords:')[1];

    const tags = keywords.split(',').flat(Infinity);

    let additionalFieldsObj = {}
    if (githubRes != undefined) {
      additionalFieldsObj = {
        github: {
          followers: githubRes.data.stats.followers,
          following: githubRes.data.stats.following,
          stars: githubRes.data.stats.stars
        }
      }
    }
    if (spotifyRes != undefined) {
      additionalFieldsObj = {
        spotify: {
          audio: spotifyRes.data.audio
        }
      }
    }
    if (soundcloudRes != undefined) {
      additionalFieldsObj = {
        soundcloud: {
          audio: soundcloudRes.data.audio,
          plays: soundcloudRes.data.plays
        }
      }
    }
    if (redditRes != undefined) {
      additionalFieldsObj = {
        reddit: {
          avatar: redditRes.data.avatar,
          birthday: redditRes.data.birthday,
          avatar: redditRes.data.karma
        }
      }
    }
    if (producthuntRes != undefined) {
      additionalFieldsObj = {
        producthunt: {
          reviews: producthuntRes.data.reviews
        }
      }
    }
    if (imdbRes != undefined) {
      additionalFieldsObj = {
        imdb: {
          director: imdbRes.data.director,
          duration: imdbRes.data.duration,
          rating: imdbRes.data.rating,
          ratingCount: imdbRes.data.ratingCount,
          writer: imdbRes.data.writer,
          year: imdbRes.data.year
        }
      }
    }
    if (amazonRes != undefined) {
      additionalFieldsObj = {
        amazon: {
          currency: amazonRes.data.currency,
          price: amazonRes.data.price
        }
      }
    }
    if (instagramRes != undefined) {
      additionalFieldsObj = {
        instagram: {
          avatar: instagramRes.data.avatar,
          stats: instagramRes.data.stats
        }
      }
    }
    if (tiktokRes != undefined) {
      additionalFieldsObj = {
        tiktok: {
          commentCount: tiktokRes.data.commentCount,
          likeCount: tiktokRes.data.likeCount,
          shareCount: tiktokRes.data.shareCount,
          song: tiktokRes.data.song
        }
      }
    }
    if (youtubeRes != undefined) {
      additionalFieldsObj = {
        youtube: {
          audio: youtubeRes.data.audio,
          video: youtubeRes.data.video,
          views: youtubeRes.data.views
        }
      }
    }
    if (twitterRes != undefined) {
      additionalFieldsObj = {
        twitter: {
          stats: twitterRes.data.stats
        }
      }
    }

    let result = {

      core: iframely.value.data,
      brandcolors: brandcolorURL
        ? {
          logoColor: uniqueLogoCol,
          landingPageColor: uniqueColor,
        }
        : null,
      html: htmlURL ? html.value.data.html : null,
      iframe: iframeURL ? iframe.value.data.html : null,
      links: linkURL ? realLinks : null,
      email: emailURL ? emailsArr : null,
      phonenumber: phonenumberURL ? phoneNumArr : null,
      sociallink: sociallinkURL ? sociallink.value.data.socialLinks : null,
      category: categoryURL ? uniqueCategoty : null,
      text: textURL ? article.textContent.replace(/\n/g, '') : null,
      screenshot: {
        fullscreenshot: fullscreenshotURL
          ? fullscreenshot.value.data.screenshot
          : null,
        screenshot: screenshotURL ? screenshot.value.data.screenshot : null,
      },
      healthcheck: healthcheckURL ? { statusCode: healthcheck.value.data.function.value.statusCode } : null,
      technologystack: technologystackURL
        ? technologystack.value.data.insights.technologies
        : null,
      additionalFields: additionalFieldsObj,
      excerpts: excerptsURL ? excerpt.value.value : null,
      digitalrank: digitalrankURL ? digitalRes.data.similar_rank : null,
      traffic: trafficURL ? traffic.value.data.workflow.data : null,
      tagsData: tags,
      summaryText: summary
    };
    return result;
  },
});
