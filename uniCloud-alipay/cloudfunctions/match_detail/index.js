'use strict';

const db = uniCloud.database();
const matchesCollection = db.collection('matches');

exports.main = async (event, context) => {
  const { matchId } = event;
  
  if (!matchId) {
    return {
      code: 1,
      msg: '参数不完整'
    };
  }

  try {
    const match = await matchesCollection.doc(matchId).get();
    
    if (!match.data || match.data.length === 0) {
      return {
        code: 2,
        msg: '比赛不存在'
      };
    }

    return {
      code: 0,
      msg: '获取成功',
      data: match.data[0]
    };
  } catch (e) {
    console.error('获取比赛详情失败：', e);
    return {
      code: 3,
      msg: '获取失败'
    };
  }
}; 