const client = require("./elasticsearch-client");
const axios = require("axios");

const createResponse = (status, body) => ({
  statusCode: status,
  body: JSON.stringify(body),
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

exports.getItem = async (event) => {
  try {
    const response = await axios.get("http://api.ssho.tech:8081/item");
    return createResponse(200, response.data.slice(0, 20));
  } catch (err) {
    return createResponse(400, err);
  }
};
