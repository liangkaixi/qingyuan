'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

/**
 * 获取用户的预约列表
 * @param {Object} event 请求参数
 * @param {String} event.userId 用户ID
 * @param {Array} event.status 预约状态数组，如 ['pending', 'confirmed']
 * @param {Number} event.page 页码，从1开始
 * @param {Number} event.pageSize 每页数量
 * @return {Object} 预约列表数据
 */
exports.main = async (event, context) => {
	console.log('venue_booking_list 云函数被调用，参数：', event);
	
	// 参数校验
	if (!event.userId) {
		console.error('缺少用户ID');
		return {
			code: 1,
			msg: '缺少用户ID',
		};
	}

	// 默认值处理
	const page = event.page || 1;
	const pageSize = event.pageSize || 10;
	const status = event.status || ['pending', 'confirmed'];
	
	console.log('处理后的参数：', {
		userId: event.userId,
		status,
		page,
		pageSize
	});

	// 计算跳过的记录数
	const skip = (page - 1) * pageSize;

	try {
		// 先查询所有记录，看看数据
		const allRecords = await db.collection('bookings').get();
		console.log('数据库中所有记录：', allRecords.data);

		// 构建查询条件
		const query = {
			user_id: event.userId,
			status: 'confirmed' // 直接使用字符串，而不是数组
		};
		
		console.log('查询条件：', query);

		// 查询预约列表
		const bookingCollection = db.collection('bookings');

		// 使用聚合查询，关联场地信息
		const aggregateResult = await bookingCollection
			.aggregate()
			.match(query)
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
				date: 1,
				start_time: 1,
				end_time: 1,
				type: 1,
				half_court: 1,
				status: 1,
				create_time: 1,
				update_time: 1,
				contact_phone: 1,
				remark: 1,
				'venueInfo.name': 1,
				'venueInfo.address': 1
			})
			.sort({
				date: 1,
				start_time: 1
			})
			.skip(skip)
			.limit(pageSize)
			.end();
			
		console.log('聚合查询结果：', aggregateResult);

		// 处理结果
		const list = aggregateResult.data.map(item => {
			// 提取场地信息
			const venueInfo = item.venueInfo && item.venueInfo.length > 0 ? item.venueInfo[0] : {};
			
			// 场地ID到名称的映射
			const venueNameMap = {
				'68005f87b5b6a5294f4d32a2': '青沅篮球馆1号球场',
				'68005f87b5b6a5294f4d32a3': '青沅篮球馆2号球场',
				'68005f87b5b6a5294f4d32a4': '青沅篮球馆幼儿球场'
			};
			
			// 使用映射获取场地名称，如果没有映射则使用数据库中的名称或默认值
			const venueName = venueNameMap[item.venue_id] || venueInfo.name || '未知场地';
			
			return {
				_id: item._id,
				venueId: item.venue_id,
				venueName: venueName,
				venueAddress: venueInfo.address || '',
				userId: item.user_id,
				date: item.date,
				startTime: item.start_time,
				endTime: item.end_time,
				type: item.type,
				halfCourt: item.half_court,
				status: item.status,
				createTime: item.create_time,
				updateTime: item.update_time,
				contactPhone: item.contact_phone,
				remark: item.remark
			};
		});
		
		console.log('处理后的预约列表：', list);

		// 查询总数
		const countResult = await bookingCollection.where(query).count();
		const total = countResult.total;
		
		console.log('预约总数：', total);

		return {
			code: 0,
			msg: '获取预约列表成功',
			data: {
				list,
				total,
				page,
				pageSize
			}
		};
	} catch (e) {
		console.error('获取预约列表失败', e);
		return {
			code: 2,
			msg: '获取预约列表失败',
			error: e.message
		};
	}
}; 
 