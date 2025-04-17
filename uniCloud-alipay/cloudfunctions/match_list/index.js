'use strict';

const db = uniCloud.database();
const matchesCollection = db.collection('matches');
const _ = db.command;

exports.main = async (event, context) => {
  const { uniIdToken, OPENID } = event;
  const { page = 1, pageSize = 10, status } = event;
  
  // 参数校验
  if (!uniIdToken) {
    return {
      code: 1,
      msg: '请先登录'
    };
  }

  try {
    // 构建查询条件
    const query = {
      user_id: OPENID
    };
    
    // 如果指定了状态，添加状态筛选
    if (status) {
      query.status = status;
    }

    // 查询总数
    const countResult = await matchesCollection.where(query).count();
    const total = countResult.total;

    // 查询列表
    const list = await matchesCollection
      .where(query)
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      msg: '获取成功',
      data: {
        list: list.data,
        total,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('获取比赛列表失败：', e);
    return {
      code: 2,
      msg: '获取比赛列表失败'
    };
  }
}; 