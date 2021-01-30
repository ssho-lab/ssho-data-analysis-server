const client = require("./elasticsearch-client");
const axios = require("axios");

const createResponse = (status, body) => ({
  statusCode: status,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
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

exports.getItemListWithCount = async (event) => {
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

    const response = await axios.get("http://api.ssho.tech:8080/item");
    const itemList = response.data;

    const map = new Map();

    itemList.forEach((item) => {
      if (!item) return;
      map.set(item.id, { ...item, showCount: 0 });
    });

    itemIdCounts.forEach((el) => {
      if (!map.has(el.key)) return;
      map.set(el.key, { ...map.get(el.key), showCount: el.doc_count });
    });

    const itemListWithCount = [...map.values()];

    return createResponse(200, itemListWithCount);
  } catch (err) {
    return createResponse(400, err);
  }
};

exports.getSwipeSetsPerUser = async (event) => {
  try {
    const { data: swipeLogs } = await axios.get("http://api.ssho.tech:8082/log/swipe");

    let swipeLogsPerUser = new Map();

    swipeLogs.forEach((log) => {
      if (swipeLogsPerUser.has(log.userId)) {
        swipeLogsPerUser.get(log.userId).setList.push(log.userCardSetId);
      } else {
        swipeLogsPerUser.set(log.userId, {
          userId: log.userId,
          setList: [],
          setCount: 0,
          averageLike: 0,
        });
      }
    });

    [...swipeLogsPerUser.keys()].forEach((userId) => {
      swipeLogsPerUser.get(userId).setList = Array.from(
        new Set([...swipeLogsPerUser.get(userId).setList])
      );
    });

    [...swipeLogsPerUser.keys()].forEach((userId) => {
      swipeLogsPerUser.get(userId).setList = swipeLogsPerUser.get(userId).setList.map((setId) => {
        return { setId, cardList: [], likeRatio: 0 };
      });
    });

    swipeLogs.forEach((log) => {
      const set = swipeLogsPerUser
        .get(log.userId)
        .setList.find((set) => set.setId == log.userCardSetId);
      set.cardList.push(log);
    });

    [...swipeLogsPerUser.keys()].forEach((userId) => {
      swipeLogsPerUser.get(userId).setCount = swipeLogsPerUser.get(userId).setList.length;
      swipeLogsPerUser.get(userId).setList.forEach((set) => {
        set.likeRatio = set.cardList.filter((card) => card.score == 1).length / set.cardList.length;
      });
    });

    return createResponse(200, [...swipeLogsPerUser.values()]);
  } catch (err) {
    console.log(err);
    return createResponse(400, err);
  }
};
