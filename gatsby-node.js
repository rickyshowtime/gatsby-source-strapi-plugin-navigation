const fetch = require("node-fetch");

const fetchNavigationItems = async (url, headers) => {
  try {
    const response = await fetch(url, {
      headers: headers,
    });
    return response.json();
  } catch (error) {
    reporter.error(`Error, failed to fetch ${url}},`, error);
    return null;
  }
};
const generateNavigationName = (navigation) => {
  let node_name = `StrapiNavigationPlugin${capitalize(navigation.slugOrId)}`;

  if (navigation.name) {
    node_name = `StrapiNavigationPlugin${navigation.name}`;
  }
  return node_name
}

const capitalize = (s) => {
  if (typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

exports.sourceNodes = async (
  { actions: { createNode }, createNodeId, createContentDigest, reporter, },
  { apiURL, token, navigations }
) => {
  if (!apiURL || apiURL === "") {
    reporter.error(`Error, apiUrl is empty!`);
  }

  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  for (const navigation of navigations) {
    const url = `${apiURL}/api/navigation/render/${navigation.slugOrId}/${navigation.type ? `?type=${navigation.type}` : ""
      }`;
    const items = await fetchNavigationItems(url, headers);

    const NAVIGATION_NODE = generateNavigationName(navigation);

    if (items && Array.isArray(items)) {
      items.map((item, index) => {
        const node = {
          ...item,
          parentNode: item.parent,
          id: createNodeId(`${NAVIGATION_NODE}-${item.id}`),
          parent: null,
          children: [],
          internal: {
            type: NAVIGATION_NODE,
            content: JSON.stringify(item),
            contentDigest: createContentDigest(item),
          },
        };
        createNode(node);

      });
    } else {
      reporter.error(`Error, navigation "${NAVIGATION_NODE}" is empty or isn´t array`);
    }
  }
  reporter.success(
    `Successfully sourced navigation items.`
  );
};


exports.createSchemaCustomization = ({ actions, schema }, { navigations, schemaForOptionalRelatedFields }) => {
  const { createTypes } = actions
  for (const navigation of navigations) {
    const NAVIGATION_NODE = generateNavigationName(navigation);
    createTypes(`
    type ${NAVIGATION_NODE} implements Node {
      items: [Items!]
    }
    type Items {
      slug: String
      title: String
      type: String
      path: String
      related: Related!
    }
    type Related {
      ${schemaForOptionalRelatedFields}
    }
  `)
  }
}
