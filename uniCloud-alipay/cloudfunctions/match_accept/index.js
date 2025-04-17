'use strict';

const db = uniCloud.database();
const matchesCollection = db.collection('matches');

exports.main = async (event, context) => {
  // 获取用户信息
  const { uniIdToken, OPENID } = event;
  if (!uniIdToken) {
    return {
      code: 1,
      msg: '请先登录',
    };
  }

  const { matchId, teamName, contactPhone, userId } = event;

  // 参数校验
  if (!matchId || !teamName || !contactPhone || !userId) {
    return {
      code: 2,
      msg: '参数不完整',
    };
  }

  try {
    // 查询比赛信息
    const matchResult = await matchesCollection.doc(matchId).get();
    if (!matchResult.data || matchResult.data.length === 0) {
      return {
        code: 3,
        msg: '比赛不存在',
      };
    }

    const match = matchResult.data[0];

    // 检查比赛状态
    if (match.status !== 'pending') {
      return {
        code: 4,
        msg: '比赛状态不允许接受',
      };
    }

    // 检查是否是自己发起的比赛
    if (match.userId === userId) {
      return {
        code: 5,
        msg: '不能接受自己发起的比赛',
      };
    }

    // 检查是否已经接受过这场比赛
    if (match.teams && match.teams.some(team => team.userId === userId)) {
      return {
        code: 6,
        msg: '您已经接受过这场比赛',
      };
    }

    // 添加球队信息
    const teamInfo = {
      userId,
      name: teamName,
      contactPhone,
      status: 'accepted',
      acceptTime: new Date().toISOString(),
    };

    // 更新比赛信息
    const updateResult = await matchesCollection.doc(matchId).update({
      teams: db.command.push(teamInfo),
    });

    if (updateResult.updated === 1) {
      return {
        code: 0,
        msg: '接受成功',
      };
    } else {
      return {
        code: 7,
        msg: '接受失败',
      };
    }
  } catch (e) {
    console.error('接受比赛失败:', e);
    return {
      code: 8,
      msg: '系统错误',
    };
  }
}; 