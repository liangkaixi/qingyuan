'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
	// 参数校验
	const { bookingId } = event;
	if (!bookingId) {
		return {
			code: 1,
			msg: '缺少必要参数：bookingId'
		};
	}

	try {
		// 查询预约详情
		const bookingResult = await db.collection('venue_bookings')
			.aggregate()
			.match({
				_id: bookingId
			})
			.lookup({
				from: 'venues',
				localField: 'venue_id',
				foreignField: '_id',
				as: 'venueInfo'
			})
			.project({
				_id: 1,
				venue_id: 1,
				user_id: 1,
				start_time: 1,
				end_time: 1,
				status: 1,
				create_time: 1,
				update_time: 1,
				contact_name: 1,
				contact_phone: 1,
				remark: 1,
				'venueInfo.name': 1,
				'venueInfo.address': 1,
				'venueInfo.images': 1
			})
			.end();

		if (!bookingResult.data || bookingResult.data.length === 0) {
			return {
				code: 1,
				msg: '预约记录不存在'
			};
		}

		// 处理返回数据
		const bookingDetail = bookingResult.data[0];
		bookingDetail.venueInfo = bookingDetail.venueInfo[0];
		
		// 转换字段名称以匹配前端期望的格式
		const formattedBooking = {
			_id: bookingDetail._id,
			venueId: bookingDetail.venue_id,
			venueName: getVenueName(bookingDetail.venue_id, bookingDetail.venueInfo.name),
			venueAddress: bookingDetail.venueInfo.address || '',
			userId: bookingDetail.user_id,
			date: bookingDetail.date,
			startTime: bookingDetail.start_time,
			endTime: bookingDetail.end_time,
			type: bookingDetail.type,
			halfCourt: bookingDetail.half_court,
			status: bookingDetail.status,
			createTime: bookingDetail.create_time,
			updateTime: bookingDetail.update_time,
			contactPhone: bookingDetail.contact_phone,
			remark: bookingDetail.remark
		};

		return {
			code: 0,
			msg: '获取预约详情成功',
			data: formattedBooking
		};
	} catch (error) {
		console.error('获取预约详情失败：', error);
		return {
			code: 1,
			msg: '获取预约详情失败'
		};
	}
};

// 获取场地名称的辅助函数
function getVenueName(venueId, defaultName) {
	const venueNameMap = {
		'68005f87b5b6a5294f4d32a2': '青沅篮球馆1号球场',
		'68005f87b5b6a5294f4d32a3': '青沅篮球馆2号球场',
		'68005f87b5b6a5294f4d32a4': '青沅篮球馆幼儿球场'
	};
	
	return venueNameMap[venueId] || defaultName || '未知场地';
} 
 