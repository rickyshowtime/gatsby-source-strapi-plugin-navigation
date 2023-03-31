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
  let node_name = `StrapiNavigation${capitalize(navigation.slugOrId)}`;

  if (navigation.name) {
    node_name = `StrapiNavigation${navigation.name}`;
  }

  if(navigation.default){
    node_name = `StrapiNavigation`;
  }
  return node_name
}

const capitalize = (s) => {
  if (typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

exports.sourceNodes = async (
  { actions: { createNode, createParentChildLink }, getNode, createNodeId, createContentDigest, reporter, },
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

    const createdNode = []

    if (items && Array.isArray(items)) {
      items.map((item, index) => {
        let parentNode;
        if(item.parent){
          const parent = item.parent
          parentNode = createdNode.find(parentId => parentId === parent.id)
          if(!parentNode){
            parentNode = {
              ...parent,
              id: createNodeId(`${NAVIGATION_NODE}-${parent.id}`),
              _id: parent.id,
              parent: null,
              children: [],
              internal: {
                type: NAVIGATION_NODE,
                content: JSON.stringify(parent),
                contentDigest: createContentDigest(parent),
              },
            };
            createNode(parentNode);
            createdNode.push(parentNode._id)
          }
        }
        if(createdNode.find(itemId => itemId === item.id)){
          return
        }
        const node = {
          ...item,
          parentNode: {
            ...item.parent
          },
          id: createNodeId(`${NAVIGATION_NODE}-${item.id}`),
          _id: item.id,
          parent: parentNode ? parentNode.id : null,
          children: [],
          internal: {
            type: NAVIGATION_NODE,
            content: JSON.stringify(item),
            contentDigest: createContentDigest(item),
          },
        };
        createNode(node);
        if(parentNode){
          //createParentChildLink({ parent: parentNode, child: node })
        }
        createdNode.push(node._id)
      });
    } else {
      reporter.error(`Error, navigation "${NAVIGATION_NODE}" is empty or isn´t array`);
    }
  }
  reporter.success(
    `Successfully sourced navigation items.`
  );
};


exports.createSchemaCustomization = ({ actions, schema }, { navigations, schemaForOptionalRelatedFields = "" }) => {
  const { createTypes } = actions
  for (const navigation of navigations) {
    const NAVIGATION_NODE = generateNavigationName(navigation);
    const typeDefs = [
      `
        type ${NAVIGATION_NODE} implements Node {
          items: [Items!]
        }
        type Items {
          slug: String
          title: String
          type: String
          path: String
          ${schemaForOptionalRelatedFields && `related: Related!`} 
        }
        ${schemaForOptionalRelatedFields &&
      `type Related {
              ${schemaForOptionalRelatedFields}
          }`
      }
    `,
      schema.buildObjectType({
        name: NAVIGATION_NODE,
        fields: {
          navigationChildren: {
            type: `[${NAVIGATION_NODE}]`,
            resolve: async (source, args, context, info) => {
              let filters = {parentNode: {id: {eq: source._id}}}

              const { entries, totalCount } = await context.nodeModel.findAll({
                type: NAVIGATION_NODE,
                query: {
                  filter: filters
                }
              });
              return entries
            }
          }
        }
      })
    ]
    createTypes(typeDefs)
  }
}
