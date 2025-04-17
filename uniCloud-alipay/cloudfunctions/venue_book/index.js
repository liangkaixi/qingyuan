'use strict';

const db = uniCloud.database();
const venuesCollection = db.collection('venues');
const bookingsCollection = db.collection('bookings');

exports.main = async (event, context) => {
	try {
		// 参数校验
		const { venueId, date, startTime, endTime, type, halfCourt, contactPhone, remark, userId } = event;
		if (!venueId || !date || !startTime || !endTime || !type || !contactPhone || !userId) {
			return {
				code: 1,
				msg: '参数不完整'
			};
		}

		// 检查场地是否存在
		const venue = await venuesCollection.doc(venueId).get();
		if (!venue.data || venue.data.length === 0) {
			return {
				code: 3,
				msg: '场地不存在'
			};
		}

		// 检查场地类型是否可用
		const venueData = venue.data[0];
		// 确保 availableTypes 存在，如果不存在则默认为 ['full', 'half']
		const availableTypes = venueData.availableTypes || ['full', 'half'];
		
		if (type === 'full' && !availableTypes.includes('full')) {
			return {
				code: 4,
				msg: '全场预约不可用'
			};
		}
		if (type === 'half' && !availableTypes.includes('half')) {
			return {
				code: 5,
				msg: '半场预约不可用'
			};
		}

		// 检查时间段是否已被预约
		const existingBookings = await bookingsCollection
			.where({
				venue_id: venueId,
				date: date,
				status: 'confirmed',
				$or: [
					{
						start_time: db.command.lte(startTime),
						end_time: db.command.gt(startTime)
					},
					{
						start_time: db.command.lt(endTime),
						end_time: db.command.gte(endTime)
					},
					{
						start_time: db.command.gte(startTime),
						end_time: db.command.lte(endTime)
					}
				]
			})
			.get();

		if (existingBookings.data && existingBookings.data.length > 0) {
			// 如果是半场预约，检查是否与同一半场的预约冲突
			if (type === 'half' && halfCourt) {
				const halfCourtBookings = existingBookings.data.filter(
					booking => booking.type === 'half' && booking.half_court === halfCourt
				);
				
				if (halfCourtBookings.length > 0) {
					return {
						code: 6,
						msg: '该时间段已被预约'
					};
				}
			} else if (type === 'full') {
				// 全场预约与任何预约都冲突
				return {
					code: 6,
					msg: '该时间段已被预约'
				};
			}
		}

		// 创建预约记录
		const bookingData = {
			venue_id: venueId,
			user_id: userId,
			date: date,
			start_time: startTime,
			end_time: endTime,
			type: type,
			half_court: type === 'half' ? halfCourt : null,
			contact_phone: contactPhone,
			remark: remark || '',
			status: 'confirmed',
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString()
		};

		const result = await bookingsCollection.add(bookingData);

		return {
			code: 0,
			msg: '预约成功',
			data: {
				bookingId: result.id
			}
		};
	} catch (e) {
		console.error(e);
		return {
			code: -1,
			msg: '系统错误'
		};
	}
}; 