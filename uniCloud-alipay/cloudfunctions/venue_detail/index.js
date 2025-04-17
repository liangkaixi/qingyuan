'use strict';

const db = uniCloud.database();
const venuesCollection = db.collection('venues');

exports.main = async (event, context) => {
	try {
		const { id } = event;
		
		// 参数校验
		if (!id) {
			return {
				code: 1,
				msg: '参数不完整'
			};
		}
		
		// 查询场地信息
		const { data: venues } = await venuesCollection
			.doc(id)
			.get();
			
		if (!venues || venues.length === 0) {
			return {
				code: 2,
				msg: '场地不存在'
			};
		}
		
		const venue = venues[0];
		
		return {
			code: 0,
			msg: 'success',
			data: venue
		};
		
	} catch (e) {
		console.error(e);
		return {
			code: -1,
			msg: '系统错误'
		};
	}
}; 