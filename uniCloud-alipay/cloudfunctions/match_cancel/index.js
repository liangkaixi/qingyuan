'use strict';

const db = uniCloud.database();
const matchesCollection = db.collection('matches');

exports.main = async (event, context) => {
  const { uniIdToken, OPENID } = event;
  const { matchId } = event;
  
  // 参数校验
  if (!uniIdToken) {
    return {
      code: 1,
      msg: '请先登录'
    };
  }

  if (!matchId) {
    return {
      code: 2,
      msg: '参数不完整'
    };
  }

  try {
    // 查询比赛是否存在且属于当前用户
    const match = await matchesCollection.doc(matchId).get();
    if (!match.data || match.data.length === 0) {
      return {
        code: 3,
        msg: '比赛不存在'
      };
    }

    const matchData = match.data[0];
    if (matchData.user_id !== OPENID) {
      return {
        code: 4,
        msg: '无权操作此比赛'
      };
    }

    // 更新比赛状态为已取消
    await matchesCollection.doc(matchId).update({
      status: 'cancelled',
      update_time: Date.now()
    });

    return {
      code: 0,
      msg: '取消成功'
    };
  } catch (e) {
    console.error('取消比赛失败：', e);
    return {
      code: 5,
      msg: '取消失败'
    };
  }
}; 
 