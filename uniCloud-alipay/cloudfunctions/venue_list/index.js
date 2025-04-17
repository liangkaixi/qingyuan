'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const collection = db.collection('venues')
	
	try {
		const { data } = await collection.get()
		return {
			code: 0,
			msg: '获取场馆列表成功',
			data
		}
	} catch (e) {
		console.error(e)
		return {
			code: -1,
			msg: '获取场馆列表失败'
		}
	}
} 