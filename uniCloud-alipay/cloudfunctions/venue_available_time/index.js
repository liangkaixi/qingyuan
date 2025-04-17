'use strict';

const db = uniCloud.database();
const bookingsCollection = db.collection('bookings');

exports.main = async (event, context) => {
	try {
		const { venueId, date } = event;
		
		// 参数校验
		if (!venueId || !date) {
			return {
				code: 1,
				msg: '参数不完整'
			};
		}
		
		console.log('查询预约记录，参数:', { venueId, date });
		
		// 查询指定日期该场地的所有预约记录
		const { data: bookings } = await bookingsCollection
			.where({
				venue_id: venueId,
				date: date,
				status: 'confirmed'
			})
			.field({
				start_time: 1,
				end_time: 1,
				type: 1,
				half_court: 1
			})
			.get();
			
		console.log('查询到的预约记录:', JSON.stringify(bookings, null, 2));
		
		// 提取已预约的时间段
		const occupiedTimes = bookings.map(booking => ({
			start: booking.start_time,
			end: booking.end_time,
			type: booking.type || 'full',
			halfCourt: booking.half_court || null
		}));
		
		console.log('处理后的占用时间段:', JSON.stringify(occupiedTimes, null, 2));
		
		return {
			code: 0,
			msg: 'success',
			data: {
				occupiedTimes
			}
		};
		
	} catch (e) {
		console.error('获取可用时间段失败:', e);
		return {
			code: -1,
			msg: '系统错误'
		};
	}
}; 
 