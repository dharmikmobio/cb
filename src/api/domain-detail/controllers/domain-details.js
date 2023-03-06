"use strict";

const { convertRestQueryParams } = require("strapi-utils");
const { standardAPI } = require("../../../../protocol");
const { parse } = require("tldts");
const { social_link } = require("../../../../constant");
/**
 * A set of functions called "actions" for `domain-details`
 */

module.exports = {
  getDomainDetails: async (ctx, next) => {
    try {
      const filter = convertRestQueryParams(ctx.request.query);

      const origin = ctx.request.query.url;
      let url = filter.where;

      if (url[0].field === "url") {
        let urlArray = await standardAPI(url[0].value);

        url[0].value = urlArray;
      }
      let queryURL = await standardAPI(ctx.request.query.url);
      let subDomainDetails = parse(queryURL);
     
      if (
        /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(
          queryURL
        )
      ) {
        const entries = await strapi.entityService.findMany(
          "api::domain-manager.domain-manager",
          {
            populate: "*",
            filters: { url: queryURL },
          }
        );

        let domain = new URL(queryURL);

        if (entries.length > 0) {
          if (entries[0].MainDomain && domain.pathname.length > 1) {
            const domainManager = await strapi.entityService.findOne(
              "api::domain-manager.domain-manager",
              entries[0].MainDomain.id,
              {
                populate: "*",
              }
            );
            const { Extras } = domainManager;
            entries[0].Extras = Extras.filter(
              (comp) => comp.isPublished === true
            );
          } else {
            entries[0].Extras = entries[0]?.Extras.filter(
              (comp) => comp?.isPublished === true
            );
          }
          ctx.response.send(entries[0]);
        } else if (domain.pathname.length > 1) {
          const data = await strapi
            .service("api::domain-detail.domain-details")
            .getDomainDetails(url, origin);

          const createDomainDetails = await strapi
            .service("api::domain-manager.domain-manager")
            .create({
              populate: "*",
              data: {
                url: queryURL,
                description: data.core.status = 404 ? 'Iframely could not fetch the given URL. The content is no longer available at the origin' : data.core.meta.description,
                title: data.core.status = 404 ? 'Iframely could not fetch the given URL. The content is no longer available at the origin' : data.core.meta.title,
                SocialWebsites: social_link.some((link) =>
                  data.core.status = 404 ? 'Iframely could not fetch the given URL. The content is no longer available at the origin' : data.core.url.startsWith(link)
                ),
                renderOnlyObj: data.core,
                DomainType: "URL",
                domainName: subDomainDetails.domain,
                TagsData: data.tagsData,
                siteSummary: data.summaryText,

                Extras: [
                  {
                    __component: "extras.brand-colors",
                    brand_colors: false,
                  },
                  {
                    __component: "extras.iframe",
                    iframe_bool: false,
                  },
                  {
                    __component: "extras.category",
                    category_bool: false,
                  },
                  {
                    __component: "extras.email",
                    email_bool: false,
                  },
                  {
                    __component: "extras.digital-rank",
                    digitalrank_bool: false,
                  },
                  {
                    __component: "extras.excerpts",
                    excerpts_bool: false,
                  },
                  {
                    __component: "extras.health-check",
                    healthcheck_bool: false,
                  },
                  {
                    __component: "extras.html",
                    html_bool: false,
                  },
                  {
                    __component: "extras.links",
                    links_bool: false,
                  },
                  {
                    __component: "extras.phone-numbers",
                    phonenumber_bool: false,
                  },
                  {
                    __component: "extras.screenshots",
                    screenshot_bool: false,
                    fullscreenshot_bool: false,
                  },
                  {
                    __component: "extras.social-links",
                    sociallink_bool: false,
                  },
                  {
                    __component: "extras.technology-stack",
                    technologystack_bool: false,
                  },
                  {
                    __component: "extras.text",
                    text_bool: false,
                  },
                  {
                    __component: "extras.traffic",
                    traffic_bool: false,
                  },
                  {
                    __component: "extras.additional-fields",
                    additionalFields: data.additionalFields,
                  },
                ],
              },
            });

          const createGemDetails = await strapi.service("api::gem.gem").create({
            data: {
              url: data.core.url,
              description: data.core.meta.description,
              title: data.core.meta.title,
            },
          });

          const mainDomain = await strapi.entityService.findMany(
            "api::domain-manager.domain-manager",
            {
              filters: { domainName: subDomainDetails.domain },
            }
          );

          let mainDomainId;
          mainDomain.map((data) => {
            let url = new URL(data.url);

            if (url.pathname.length <= 1) {
              mainDomainId = data.id;
            }
          });

          const updateDomaindetails = await strapi.entityService.update(
            "api::domain-manager.domain-manager",
            createDomainDetails.id,
            {
              populate: "*",
              data: {
                gems: createGemDetails.id,
                MainDomain: mainDomainId,
              },
            }
          );
          if (mainDomainId) {
            const domainManager = await strapi.entityService.findOne(
              "api::domain-manager.domain-manager",
              mainDomainId,
              {
                populate: "*",
              }
            );
            const { Extras } = domainManager;
            updateDomaindetails.Extras = Extras.filter(
              (comp) => comp.isPublished === true
            );
          }
          ctx.response.send(updateDomaindetails);
        } else {
          const data = await strapi
            .service("api::domain-detail.domain-details")
            .getDomainDetails(url, origin);

          const urlid = await strapi.entityService.findMany(
            "api::domain-manager.domain-manager",
            {
              filters: { domainName: subDomainDetails.domain },
            }
          );
          let result = urlid.map(({ id }) => id);

          const createDomainDetails = await strapi
            .service("api::domain-manager.domain-manager")
            .create({
              populate: "*",
              data: {
                url: data.core.url.toLowerCase().replace('www.', ''),
                description: data.core.meta.description,
                title: data.core.meta.title,
                icon: data.core.links.icon,
                logo: data.core.links.logo,
                thumbnail: data.core.links.thumbnail,
                domainName: subDomainDetails.domain,
                medium: data.core.meta.medium,
                canonical: data.core.meta.canonical,
                SocialWebsites: false,
                renderOnlyObj: data.core,
                DomainType: subDomainDetails.subdomain ? "Subdomain" : "Domain",
                TagsData: data.tagsData,
                siteSummary: data.summaryText,

                Extras: [
                  {
                    __component: "extras.brand-colors",
                    brand_colors: ctx.request.query.brandcolor,
                    logoColor:
                      ctx.request.query.brandcolor === "true"
                        ? data.brandcolors.logoColor
                        : null,
                    landingPageColor:
                      ctx.request.query.brandcolor === "true"
                        ? data.brandcolors.landingPageColor
                        : null,
                    isPublished: ctx.request.query.brandcolor,
                  },
                  {
                    __component: "extras.iframe",
                    iframe_bool: ctx.request.query.iframe,
                    iframe: data.iframe,
                    isPublished: ctx.request.query.iframe,
                  },
                  {
                    __component: "extras.category",
                    category_bool: ctx.request.query.category,
                    category: data.category,
                    isPublished: ctx.request.query.category,
                  },
                  {
                    __component: "extras.email",
                    email_bool: ctx.request.query.email,
                    email: data.email,
                    isPublished: ctx.request.query.email,
                  },
                  {
                    __component: "extras.digital-rank",
                    digitalrank_bool: ctx.request.query.digitalrank,
                    digitalrank:
                      ctx.request.query.digitalrank === "true"
                        ? data.digitalrank.rank
                        : null,
                    isPublished: ctx.request.query.digitalrank,
                  },
                  {
                    __component: "extras.excerpts",
                    excerpts_bool: ctx.request.query.excerpts,
                    excerpts: data.excerpts,
                    isPublished: ctx.request.query.excerpts,
                  },
                  {
                    __component: "extras.health-check",
                    healthcheck_bool: ctx.request.query.healthcheck,
                    statuscode:
                      ctx.request.query.healthcheck === "true"
                        ? data.healthcheck.statusCode
                        : null,
                    isPublished: ctx.request.query.healthcheck,
                  },
                  {
                    __component: "extras.html",
                    html_bool: ctx.request.query.html,
                    html: data.html,
                    isPublished: ctx.request.query.html,
                  },
                  {
                    __component: "extras.links",
                    link_bool: ctx.request.query.links,
                    links: data.links,
                    isPublished: ctx.request.query.links,
                  },
                  {
                    __component: "extras.phone-numbers",
                    phonenumber_bool: ctx.request.query.phonenumber,
                    phonenumber: data.phonenumber,
                    isPublished: ctx.request.query.phonenumber,
                  },
                  {
                    __component: "extras.screenshots",
                    screenshot_bool: ctx.request.query.screenshot,
                    fullscreenshot_bool: ctx.request.query.fullscreenshot,
                    fullscreenshot: data.screenshot.fullscreenshot,
                    screenshot: data.screenshot.screenshot,
                    isPublished: ctx.request.query.screenshot,
                  },
                  {
                    __component: "extras.social-links",
                    sociallink_bool: ctx.request.query.sociallink,
                    facebook:
                      ctx.request.query.sociallink === "true"
                        ? data.sociallink.facebook
                        : null,
                    twitter:
                      ctx.request.query.sociallink === "true"
                        ? data.sociallink.twitter
                        : null,
                    linkedin:
                      ctx.request.query.sociallink === "true"
                        ? data.sociallink.linkedIn
                        : null,
                    instagram:
                      ctx.request.query.sociallink === "true"
                        ? data.sociallink.instagram
                        : null,
                    isPublished: ctx.request.query.sociallink,
                  },
                  {
                    __component: "extras.technology-stack",
                    technologystack_bool: ctx.request.query.technologystack,
                    technologystack: data.technologystack,
                    isPublished: ctx.request.query.technologystack,
                  },
                  {
                    __component: "extras.text",
                    text_bool: ctx.request.query.text,
                    text: data.text,
                    isPublished: ctx.request.query.text,
                  },
                  {
                    __component: "extras.traffic",
                    traffic_bool: ctx.request.query.traffic,
                    traffic: data.traffic,
                    isPublished: ctx.request.query.traffic,
                  },
                  {
                    __component: "extras.additional-fields",
                    additionalFields: data.additionalFields,
                    isPublished: data.additionalFields ? true : false,
                  },
                ],
              },
            });

          const createGemDetails = await strapi.service("api::gem.gem").create({
            data: {
              url: data.core.url,
              description: data.core.meta.description,
              title: data.core.meta.title,
            },
          });

          const mainDomain = await strapi.entityService.findMany(
            "api::domain-manager.domain-manager",
            {
              filters: { domainName: subDomainDetails.domain },
            }
          );

          let mainDomainId;
          mainDomain.map((data) => {
            let url = parse(data.url);
            if (url.subdomain.length <= 1) {
              mainDomainId = data.id;
            }
          });

          if (subDomainDetails.subdomain.length > 1) {
            const updateDomaindetails = await strapi.entityService.update(
              "api::domain-manager.domain-manager",
              createDomainDetails.id,
              {
                populate: "*",
                data: {
                  gems: createGemDetails.id,
                  MainDomain: mainDomainId,
                },
              }
            );
            ctx.response.send(updateDomaindetails);
          } else {
            const updateDomaindetails = await strapi.entityService.update(
              "api::domain-manager.domain-manager",
              createDomainDetails.id,
              {
                populate: "*",
                data: {
                  gems: createGemDetails.id,
                  URLs: result,
                },
              }
            );
            ctx.response.send(updateDomaindetails);
          }
        }
      } else {
        ctx.response.send({
          status: 400,
          message:
            "Please enter the valid url; Example: 'https://curateit.com/'",
        });
      }
    } catch (error) {
      ctx.response.send(error);
    }
  },
};
