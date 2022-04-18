const fetch = require("node-fetch")

const fetchNavigationItems = async (url, headers) => {
  const response = await fetch(url, {
    headers: headers,
  })
  return response.json()

}

exports.sourceNodes = async ({
  actions: { createNode },
  createNodeId,
  createContentDigest,
  reporter,
}, { apiURL, token, navigations, }) => {


  const headers = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }


  const capitalize = (s) => {
    if (typeof s !== 'string') return s
    return s.charAt(0).toUpperCase() + s.slice(1)
  }


  for (const navigation of navigations) {
    const url = `${apiURL}/api/navigation/render/${navigation.slugOrId}/${navigation.type ? `?type=${navigation.type}` : ""}`;
    const items = await fetchNavigationItems(url, headers)

    let node_name = `StrapiNavigationPlugin${capitalize(navigation.slugOrId)}`

    if (navigation.name) {
      node_name = `StrapiNavigationPlugin${navigation.name}`
    }

    items.map((item, index) => {
      const node = {
        ...item,
        id: createNodeId(`${node_name}-${item.id}`),
        parent: null,
        children: [],
        internal: {
          type: node_name,
          content: JSON.stringify(item),
          contentDigest: createContentDigest(item),
        },
      }

      createNode(node)

    })

    reporter.success(`Successfully sourced ${navigation.slugOrId} navigation items.`)
  }




}
