'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const collection = db.collection('venues')
	
	// 检查是否已经有数据
	const { total } = await collection.count()
	if (total > 0) {
		return {
			code: -1,
			msg: '场地数据已存在，无需初始化'
		}
	}
	
	// 场地数据
	const venues = [
		{
			name: '球场1',
			address: '青沅篮球馆1号场',
			description: '标准篮球场，可分割为两个半场',
			price: 200,
			capacity: 20,
			facilities: ['标准篮球场', '可分割半场'],
			images: [
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues01.jpg',
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues02.jpg'
			],
			status: 1,
			rating: 4.5,
			review_count: 0,
			business_hours: {
				start: '06:00',
				end: '22:00'
			},
			location: {
				latitude: 30.123456,
				longitude: 120.123456
			},
			create_time: Date.now(),
			update_time: Date.now()
		},
		{
			name: '球场2',
			address: '青沅篮球馆2号场',
			description: '标准篮球场，可分割为两个半场',
			price: 200,
			capacity: 20,
			facilities: ['标准篮球场', '可分割半场', '更衣室', '淋浴'],
			images: [
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues03.jpg',
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues04.jpg'
			],
			status: 1,
			rating: 4.5,
			review_count: 0,
			business_hours: {
				start: '06:00',
				end: '22:00'
			},
			location: {
				latitude: 30.123457,
				longitude: 120.123457
			},
			create_time: Date.now(),
			update_time: Date.now()
		},
		{
			name: '小球场',
			address: '青沅篮球馆小球场',
			description: '小型篮球场，适合低年龄孩子练习和比赛',
			price: 100,
			capacity: 10,
			facilities: ['小型篮球场'],
			images: [
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues05.jpg',
				'https://env-00jxtey807pq.normal.cloudstatic.cn/jpg/venues06.jpg'
			],
			status: 1,
			rating: 4.0,
			review_count: 0,
			business_hours: {
				start: '06:00',
				end: '22:00'
			},
			location: {
				latitude: 30.123458,
				longitude: 120.123458
			},
			create_time: Date.now(),
			update_time: Date.now()
		}
	]
	
	try {
		await collection.add(venues)
		return {
			code: 0,
			msg: '场地数据初始化成功'
		}
	} catch (e) {
		console.error(e)
		return {
			code: -1,
			msg: '场地数据初始化失败'
		}
	}
} 