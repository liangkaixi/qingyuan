'use strict';

const db = uniCloud.database();
const venuesCollection = db.collection('venues');
const bookingsCollection = db.collection('bookings');

exports.main = async (event, context) => {
	try {
		console.log('收到预约请求，参数：', event);
		
		// 如果是取消预约操作
		if (event.type === 'cancel') {
			const { bookingId, userId } = event;
			console.log('取消预约参数：', { bookingId, userId });
			
			if (!bookingId || !userId) {
				return {
					code: 1,
					msg: '取消预约参数不完整'
				};
			}

			// 检查预约是否存在
			const booking = await bookingsCollection.doc(bookingId).get();
			if (!booking.data || booking.data.length === 0) {
				return {
					code: 2,
					msg: '预约不存在'
				};
			}

			const bookingData = booking.data[0];
			console.log('找到预约记录：', bookingData);

			// 检查是否是用户自己的预约
			if (bookingData.user_id !== userId) {
				return {
					code: 3,
					msg: '无权取消此预约'
				};
			}

			// 检查预约状态
			if (bookingData.status === 'cancelled') {
				return {
					code: 4,
					msg: '该预约已取消'
				};
			}

			// 更新预约状态为已取消
			await bookingsCollection.doc(bookingId).update({
				status: 'cancelled',
				update_time: new Date().toISOString()
			});

			return {
				code: 0,
				msg: '取消预约成功'
			};
		}

		// 预约场地的逻辑
		// 参数校验
		const { venueId, date, startTime, endTime, type, halfCourt, contactPhone, remark, userId } = event;
		if (!venueId || !date || !startTime || !endTime || !type || !contactPhone || !userId) {
			return {
				code: 1,
				msg: '预约参数不完整'
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
			half_court: halfCourt,
			status: 'confirmed',
			contact_phone: contactPhone,
			remark: remark,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString()
		};
		
		console.log('创建预约记录，数据：', bookingData);
		
		const result = await bookingsCollection.add(bookingData);
		
		console.log('创建预约记录结果：', result);
		
		return {
			code: 0,
			msg: '预约成功',
			data: {
				bookingId: result.id
			}
		};
	} catch (e) {
		console.error('预约操作失败：', e);
		return {
			code: -1,
			msg: '系统错误'
		};
	}
}; 