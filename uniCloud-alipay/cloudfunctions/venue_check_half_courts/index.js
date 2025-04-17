'use strict';

const db = uniCloud.database();
const bookingsCollection = db.collection('bookings');

exports.main = async (event, context) => {
	try {
		// 参数校验
		const { venueId, date } = event;
		if (!venueId || !date) {
			return {
				code: 1,
				msg: '参数不完整'
			};
		}

		// 获取当天的半场预约记录
		const bookings = await bookingsCollection
			.where({
				venue_id: venueId,
				date: date,
				type: 'half',
				status: 'confirmed'
			})
			.get();

		// 计算每个半场的占用率
		const halfCourtA = {
			occupancy: 0,
			bookings: []
		};
		const halfCourtB = {
			occupancy: 0,
			bookings: []
		};

		// 获取场地信息以确定营业时间
		const venue = await db.collection('venues').doc(venueId).get();
		if (!venue.data || venue.data.length === 0) {
			return {
				code: 2,
				msg: '场地不存在'
			};
		}

		const businessHours = venue.data[0].business_hours;
		const totalHours = calculateTotalHours(businessHours.start, businessHours.end);

		// 统计每个半场的预约情况
		bookings.data.forEach(booking => {
			const hours = calculateTotalHours(booking.start_time, booking.end_time);
			if (booking.half_court === 'half_a') {
				halfCourtA.bookings.push(booking);
				halfCourtA.occupancy += hours / totalHours;
			} else if (booking.half_court === 'half_b') {
				halfCourtB.bookings.push(booking);
				halfCourtB.occupancy += hours / totalHours;
			}
		});

		// 确保占用率不超过1
		halfCourtA.occupancy = Math.min(halfCourtA.occupancy, 1);
		halfCourtB.occupancy = Math.min(halfCourtB.occupancy, 1);

		return {
			code: 0,
			msg: '获取成功',
			data: {
				halfCourtA,
				halfCourtB
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

// 计算时间段内的小时数
function calculateTotalHours(startTime, endTime) {
	const [startHour, startMinute] = startTime.split(':').map(Number);
	const [endHour, endMinute] = endTime.split(':').map(Number);
	
	const startMinutes = startHour * 60 + startMinute;
	const endMinutes = endHour * 60 + endMinute;
	
	return (endMinutes - startMinutes) / 60;
} 