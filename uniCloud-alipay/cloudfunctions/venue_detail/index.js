'use strict';

const db = uniCloud.database();
const venuesCollection = db.collection('venues');

exports.main = async (event, context) => {
	try {
		const { id } = event;
		
		console.log('venue_detail 云函数被调用，参数：', event);
		
		// 参数校验
		if (!id) {
			console.error('缺少场地ID');
			return {
				code: 1,
				msg: '参数不完整：缺少场地ID'
			};
		}
		
		// 查询场地信息
		const { data: venues } = await venuesCollection
			.doc(id)
			.get();
			
		console.log('查询到的场地信息：', venues);
			
		if (!venues || venues.length === 0) {
			console.error('场地不存在，ID：', id);
			return {
				code: 2,
				msg: '场地不存在'
			};
		}
		
		const venue = venues[0];
		
		// 确保返回所有必要的字段
		const venueInfo = {
			_id: venue._id,
			name: venue.name,
			address: venue.address,
			description: venue.description,
			price: venue.price,
			capacity: venue.capacity,
			facilities: venue.facilities || [],
			images: venue.images || [],
			status: venue.status,
			rating: venue.rating,
			review_count: venue.review_count,
			business_hours: venue.business_hours || {
				start: '06:00',
				end: '22:00'
			},
			location: venue.location,
			availableTypes: venue.availableTypes || ['full', 'half']
		};
		
		console.log('处理后的场地信息：', venueInfo);
		
		return {
			code: 0,
			msg: 'success',
			data: venueInfo
		};
		
	} catch (e) {
		console.error('获取场地详情失败：', e);
		return {
			code: -1,
			msg: '系统错误：' + e.message
		};
	}
}; 