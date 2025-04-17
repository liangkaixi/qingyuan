'use strict';

const db = uniCloud.database();

/**
 * 检查数据库中的预约记录
 * @param {Object} event 请求参数
 * @param {String} event.userId 用户ID
 * @return {Object} 预约记录数据
 */
exports.main = async (event, context) => {
	console.log('venue_check_bookings 云函数被调用，参数：', event);
	
	// 参数校验
	if (!event.userId) {
		console.error('缺少用户ID');
		return {
			code: 1,
			msg: '缺少用户ID',
		};
	}

	try {
		// 直接查询该用户的所有记录，不加任何条件
		const rawBookings = await db.collection('venue_bookings')
			.where({})
			.get();
		
		console.log('数据库中所有预约记录：', rawBookings.data);
		
		// 查询所有预约记录
		const allBookings = await db.collection('venue_bookings')
			.where({
				user_id: event.userId
			})
			.get();
		
		console.log('用户所有预约记录：', allBookings.data);
		
		// 查询当前预约记录（不加状态条件）
		const userBookings = await db.collection('venue_bookings')
			.where({
				user_id: event.userId
			})
			.get();
		
		console.log('用户预约记录（不含状态条件）：', userBookings.data);
		
		// 查询当前预约记录
		const currentBookings = await db.collection('venue_bookings')
			.where({
				user_id: event.userId,
				status: db.command.in(['pending', 'confirmed'])
			})
			.get();
		
		console.log('用户当前预约记录（状态为pending或confirmed）：', currentBookings.data);
		
		// 查询历史预约记录
		const historyBookings = await db.collection('venue_bookings')
			.where({
				user_id: event.userId,
				status: db.command.in(['cancelled', 'completed'])
			})
			.get();
		
		console.log('用户历史预约记录：', historyBookings.data);
		
		// 检查venue_bookings集合的结构
		if (allBookings.data.length > 0) {
			console.log('预约记录的结构：', allBookings.data[0]);
			console.log('预约记录的status字段：', allBookings.data[0].status);
			console.log('预约记录的user_id字段：', allBookings.data[0].user_id);
		}

		return {
			code: 0,
			msg: '检查预约记录成功',
			data: {
				rawBookings: rawBookings.data,
				allBookings: allBookings.data,
				userBookings: userBookings.data,
				currentBookings: currentBookings.data,
				historyBookings: historyBookings.data
			}
		};
	} catch (e) {
		console.error('检查预约记录失败', e);
		return {
			code: 2,
			msg: '检查预约记录失败',
			error: e.message
		};
	}
}; 