# gatsby-source-strapi-plugin-navigation-v3

This plugin sources the [strapi-plugin-navigation](https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation).

It support custom names and independent navigation types per navigation.

## Install

yarn:

```bash
yarn add gatsby-source-strapi-plugin-navigation-v3
```

npm:

```bash
npm install gatsby-source-strapi-plugin-navigation-v3
```

## How to use

```js
// gatsby-config.js
 {
   resolve: "gatsby-source-strapi-plugin-navigation-v3",
   options: {
     apiURL: process.env.STRAPI_API_URL,
     navigations: [
       //  array of navigation end points
       {
         name: "MainNavigation", // optional
         slugOrId: "navigation",
         type: "tree"
       },
     ],
     token: process.env.STRAPI_TOKEN,
   },
 }
```

## Credits

Edited plugin [gatsby-source-strapi-plugin-navigation-v2](https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation) for own purposes.
