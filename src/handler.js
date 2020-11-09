const client = require("./elasticsearch-client");
const axios = require("axios");

const createResponse = (status, body) => ({
  statusCode: status,
  body: body,
});

exports.elasticsearchTest = async (event, context, callback) => {
  const { body } = await client.search({
    index: "item-rt",
    body: {
      query: {
        term: {
          mallNm: {
            value: "스타일난다",
          },
        },
      },
    },
  });

  return createResponse(200, body);
};

exports.getCountsPerItem = async (event) => {
  try {
    const { body } = await client.search({
      index: "activity-log-swipe",
      body: {
        aggs: {
          value_count: {
            terms: {
              field: "itemId",
            },
          },
        },
      },
    });

    const itemIdCounts = body.aggregations.value_count.buckets;

    const response = await axios.get("http://api.ssho.tech:8081/item");
    const itemList = response.data;

    const map = new Map();

    itemList.forEach((item) => map.set(item.id, { ...item, showCount: 0 }));

    itemIdCounts.forEach((el) =>
      map.set(el.key, { ...map.get(el.key), showCount: el.doc_count })
    );

    const itemListWithCount = [...map.values()];

    return createResponse(200, itemListWithCount);
  } catch (err) {
    return createResponse(400, err);
  }
};
