'use strict';

const db = uniCloud.database();
const matchesCollection = db.collection('matches');

exports.main = async (event, context) => {
  const { uniIdToken, OPENID } = event;
  const { teamName, matchType, gender, invitation, date, startTime, endTime, venueId, venueName } = event;
  
  // 参数校验
  if (!uniIdToken) {
    return {
      code: 1,
      msg: '请先登录'
    };
  }

  if (!teamName || !matchType || !invitation || !date || !startTime || !endTime || !venueId || !venueName) {
    return {
      code: 1,
      msg: '参数不完整'
    };
  }

  // 如果是排球比赛，需要验证性别参数
  if (matchType === 'volleyball' && !gender) {
    return {
      code: 3,
      msg: '请选择比赛性别'
    };
  }

  try {
    // 创建比赛记录
    const matchData = {
      userId: OPENID,
      teamName,
      matchType,
      gender: gender || '不限',
      date,
      startTime,
      endTime,
      venueId,
      venueName,
      invitation,
      status: 'pending',
      teams: [],
      create_time: Date.now(),
      update_time: Date.now()
    };

    const result = await matchesCollection.add(matchData);

    return {
      code: 0,
      msg: '创建成功',
      data: {
        matchId: result.id
      }
    };
  } catch (e) {
    console.error('创建比赛失败：', e);
    return {
      code: 2,
      msg: '创建失败'
    };
  }
}; 